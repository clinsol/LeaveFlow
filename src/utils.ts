/**
 * Calendar and Leave utility functions
 */

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
}

export function isWeekend(dateString: string): boolean {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday is 0, Saturday is 6
}

export function isFridayOrMonday(dateString: string): boolean {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 1 || day === 5; // Monday is 1, Friday is 5
}

/**
 * Generates dates for a month grid.
 * Grid always starts on Monday and ends on Sunday, so we pad with previous/next month's days.
 */
export interface CalendarCell {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

export function generateCalendarGrid(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = [];
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Day of the week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  let firstDayOfWeek = firstDay.getDay();
  // Adjust so Monday is 0, Sunday is 6
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Total days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  // Total days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  
  // 1. Pad previous month's days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = formatDateString(prevYear, prevMonth, prevDay);
    cells.push({
      dateString: dateStr,
      dayNumber: prevDay,
      isCurrentMonth: false,
      isWeekend: isWeekend(dateStr),
    });
  }

  // 2. Add current month's days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDateString(year, month, day);
    cells.push({
      dateString: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isWeekend: isWeekend(dateStr),
    });
  }

  // 3. Pad next month's days to make grid a multiple of 7 (usually 35 or 42 cells)
  const remainingCells = 42 - cells.length;
  // If grid fits in 35, let's keep it 35 unless it overflows, but 42 is safer/standard
  const gridLength = cells.length <= 35 ? 35 : 42;
  const padNextDays = gridLength - cells.length;
  
  for (let day = 1; day <= padNextDays; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = formatDateString(nextYear, nextMonth, day);
    cells.push({
      dateString: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isWeekend: isWeekend(dateStr),
    });
  }

  return cells;
}

/**
 * Calculates work days (excluding weekends) between two dates (inclusive)
 */
export function calculateWorkDays(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not weekend
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculates calendar days between two dates (inclusive)
 */
export function calculateCalendarDays(startStr: string, endStr: string): number {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Checks if a date falls inside a leave range
 */
export function isDateInLeaveRange(dateStr: string, startStr: string, endStr: string): boolean {
  const target = new Date(dateStr);
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  // Set times to midnight to compare just dates
  target.setHours(0,0,0,0);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  
  return target >= start && target <= end;
}

export interface LeaveFlag {
  type: 'warning' | 'info' | 'critical';
  rule: string;
  message: string;
}

export interface LeaveAuditResult {
  flags: LeaveFlag[];
  isSuspected: boolean;
  isCancelled: boolean;
  cancelReason?: string;
  riskScore: number; // 0 to 100
}

export function auditLeaveRequest(
  leave: { type: string; dateStart: string; dateEnd: string; reason: string; id?: string },
  holidays: { date: string; name: string; type: string }[],
  allLeaves: { type: string; dateStart: string; dateEnd: string; id: string; status: string }[]
): LeaveAuditResult {
  const flags: LeaveFlag[] = [];
  let isCancelled = false;
  let cancelReason = '';
  let riskScore = 0;

  const start = new Date(leave.dateStart);
  const end = new Date(leave.dateEnd);
  const reasonLower = leave.reason.toLowerCase().trim();

  // Reference date for the notice period check (anchored to today)
  const refDate = new Date();
  refDate.setHours(0, 0, 0, 0);

  // Rule 1: Backdated non-sick leave (Senior HR Policy: No retroactive annual/casual leave bookings)
  if (start < refDate && leave.type !== 'Sick') {
    isCancelled = true;
    cancelReason = "Retroactive Leave Booking: Policy forbids booking non-emergency leave in the past.";
    flags.push({
      type: 'critical',
      rule: 'Backdated Booking',
      message: 'Retroactive leave booking is prohibited for non-sick leaves.'
    });
    riskScore += 90;
  }

  // Rule 2: Zero or Vague Reason for long bookings
  const isVague = reasonLower === '' || reasonLower.length < 5 || ['xyz', 'abc', 'personal', 'work', 'none', 'etc', 'test', 'leave', 'some work'].includes(reasonLower);
  const totalWorkDays = calculateWorkDays(leave.dateStart, leave.dateEnd);
  if (isVague && totalWorkDays >= 3 && leave.type !== 'Sick') {
    isCancelled = true;
    cancelReason = "Policy Violation: Long-duration leaves (3+ days) require a comprehensive and verified reason.";
    flags.push({
      type: 'critical',
      rule: 'Insufficient Reason',
      message: 'A clear reason is required for leaves of 3 or more days.'
    });
    riskScore += 80;
  }

  // Rule 3: Sick Leave suspicious words (e.g. party, holiday, trip, concert)
  const suspiciousTravelWords = ['trip', 'travel', 'vacation', 'holiday', 'concert', 'flight', 'tour', 'party', 'celebration', 'wedding', 'marriage', 'festival'];
  const containsSuspiciousWord = suspiciousTravelWords.some(word => reasonLower.includes(word));
  if (leave.type === 'Sick' && containsSuspiciousWord) {
    flags.push({
      type: 'critical',
      rule: 'Sick Leave Abuse',
      message: `Suspicious reason for Sick Leave: Mention of leisure/travel terms ("${suspiciousTravelWords.find(word => reasonLower.includes(word))}").`
    });
    riskScore += 60;
  }

  // Rule 4: Sick Leave Weekend/Holiday Extension (Sandwiching)
  const startDay = start.getDay();
  const endDay = end.getDay();
  const isStartMonOrFri = startDay === 1 || startDay === 5;
  const isEndMonOrFri = endDay === 1 || endDay === 5;
  if (leave.type === 'Sick' && (isStartMonOrFri || isEndMonOrFri)) {
    flags.push({
      type: 'warning',
      rule: 'Weekend Sick Extension',
      message: 'Sick leave booked adjacent to the weekend (Friday/Monday) is flagged for medical certificate verification.'
    });
    riskScore += 40;
  }

  // Rule 5: Non-sick leave Weekend Sandwiching (Friday or Monday)
  if (leave.type !== 'Sick' && (isStartMonOrFri || isEndMonOrFri)) {
    flags.push({
      type: 'info',
      rule: 'Weekend Sandwich',
      message: 'Booked adjacent to the weekend. Creates an extended weekend block.'
    });
    riskScore += 15;
  }

  // Rule 6: Holiday Bridge/Extension
  // Check if dates are immediately adjacent to any company holidays
  const isAdjacentToHoliday = holidays.some(h => {
    const hDate = new Date(h.date);
    const dayDiffStart = Math.abs(start.getTime() - hDate.getTime()) / (1000 * 60 * 60 * 24);
    const dayDiffEnd = Math.abs(end.getTime() - hDate.getTime()) / (1000 * 60 * 60 * 24);
    return dayDiffStart === 1 || dayDiffEnd === 1;
  });
  if (isAdjacentToHoliday) {
    flags.push({
      type: 'warning',
      rule: 'Holiday Extension (Bridge)',
      message: 'This leave is bridged with a public company holiday to extend time off.'
    });
    riskScore += 25;
  }

  // Rule 7: Overbooking check with other concurrent company team members / double booking with holidays
  const isDoubleBookingWithHoliday = holidays.some(h => h.date === leave.dateStart || h.date === leave.dateEnd);
  if (isDoubleBookingWithHoliday && leave.type !== 'Optional') {
    flags.push({
      type: 'warning',
      rule: 'Holiday Clash',
      message: 'Booking a leave on a day that is already a declared company holiday.'
    });
    riskScore += 20;
  }

  // Rule 8: Insufficient Notice Period (Except Sick Leave)
  const diffTime = start.getTime() - refDate.getTime();
  const daysNotice = diffTime / (1000 * 60 * 60 * 24);
  if (leave.type !== 'Sick' && daysNotice >= 0 && daysNotice < 3) {
    flags.push({
      type: 'warning',
      rule: 'Short Notice',
      message: `Booked with short notice (${Math.max(0, Math.floor(daysNotice))} days ahead). HR guidelines require at least 3 days notice.`
    });
    riskScore += 30;
  }

  // Rule 9: Winter Peak Season Block (Dec 15 - Dec 31)
  const isWinterPeak = (start.getMonth() === 11 && start.getDate() >= 15) || (end.getMonth() === 11 && end.getDate() >= 15);
  if (isWinterPeak) {
    flags.push({
      type: 'warning',
      rule: 'Peak Season Booking',
      message: 'Leave requested during year-end freeze period (Dec 15 - Dec 31). Requires department head sign-off.'
    });
    riskScore += 30;
  }

  // Rule 10: High Frequency window check
  if (allLeaves && allLeaves.length > 0) {
    const concurrentLeavesInMonth = allLeaves.filter(ol => {
      if (ol.id === leave.id || ol.status === 'Rejected') return false;
      const olStart = new Date(ol.dateStart);
      const daysDiff = Math.abs(start.getTime() - olStart.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    if (concurrentLeavesInMonth.length >= 2) {
      flags.push({
        type: 'warning',
        rule: 'High Frequency',
        message: `High leave frequency: ${concurrentLeavesInMonth.length + 1} leaves booked within a 30-day window.`
      });
      riskScore += 25;
    }
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, riskScore);

  const isSuspected = riskScore >= 40 && !isCancelled;

  return {
    flags,
    isSuspected,
    isCancelled,
    cancelReason: isCancelled ? cancelReason : undefined,
    riskScore
  };
}
