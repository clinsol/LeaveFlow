import React, { useState } from 'react';
import { 
  Calendar, 
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  CalendarDays,
  Plus,
  Trash2,
  Download,
  Check,
  Edit2,
  X,
  Upload,
  FileText,
  Copy,
  Search
} from 'lucide-react';
import { LeaveRequest, Holiday, LeaveCategory } from '../types';
import { isFridayOrMonday, calculateWorkDays, auditLeaveRequest } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import LeaveSuggestions from './LeaveSuggestions';

interface DashboardViewProps {
  leaves: LeaveRequest[];
  onAddLeave: (leave: Omit<LeaveRequest, 'id'>) => void;
  onEditLeave: (id: string, updatedLeave: Omit<LeaveRequest, 'id'>) => void;
  onDeleteLeave: (id: string) => void;
  onDeleteAllLeaves: () => void;
  openBookingModal: () => void;
  categories: LeaveCategory[];
  holidays: Holiday[];
  onUploadHolidays: (uploadedHolidays: Holiday[]) => void;
  onEditHoliday?: (id: string, holiday: Omit<Holiday, 'id'>) => void;
  onDeleteHoliday?: (id: string) => void;
}

export default function DashboardView({
  leaves,
  onAddLeave,
  onEditLeave,
  onDeleteLeave,
  onDeleteAllLeaves,
  openBookingModal,
  categories,
  holidays,
  onUploadHolidays,
  onEditHoliday,
  onDeleteHoliday
}: DashboardViewProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Upload calendar states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parsedHolidays, setParsedHolidays] = useState<Omit<Holiday, 'id'>[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Edit Leave States
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [editLeaveType, setEditLeaveType] = useState<string>('Accrued');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState('');

  // Edit Holiday States
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editHolidayName, setEditHolidayName] = useState('');
  const [editHolidayDate, setEditHolidayDate] = useState('');
  const [editHolidayType, setEditHolidayType] = useState<'Company' | 'Mandatory' | 'Optional'>('Company');
  const [editHolidayError, setEditHolidayError] = useState('');
  const [activeHolidayMenuId, setActiveHolidayMenuId] = useState<string | null>(null);

  const handleOpenEditHoliday = (holiday: Holiday) => {
    setEditingHolidayId(holiday.id);
    setEditHolidayName(holiday.name);
    setEditHolidayDate(holiday.date);
    setEditHolidayType(holiday.type);
    setEditHolidayError('');
    setActiveHolidayMenuId(null);
  };

  const handleSaveEditHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHolidayId) return;

    if (!editHolidayName || !editHolidayDate) {
      setEditHolidayError('Please fill out all fields.');
      return;
    }

    if (onEditHoliday) {
      onEditHoliday(editingHolidayId, {
        name: editHolidayName,
        date: editHolidayDate,
        type: editHolidayType
      });
    }

    setEditingHolidayId(null);
  };

  const handleOpenEditLeave = (leave: LeaveRequest) => {
    setEditingLeaveId(leave.id);
    setEditLeaveType(leave.type);
    setEditStartDate(leave.dateStart);
    setEditEndDate(leave.dateEnd);
    setEditReason(leave.reason);
    setEditError('');
    setActiveMenuId(null);
  };

  const handleSaveEditLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaveId) return;

    const days = calculateWorkDays(editStartDate, editEndDate);
    if (days <= 0) {
      setEditError('Date range is invalid or only contains weekends.');
      return;
    }

    // Validation for limits
    const category = categories.find(c => c.name === editLeaveType);
    if (category) {
      const usedDays = leaves
        .filter(l => l.type === editLeaveType && l.id !== editingLeaveId)
        .reduce((sum, curr) => sum + curr.days, 0);
      
      if (usedDays + days > category.total) {
        setEditError(`Cannot book ${days} days. You only have ${(category.total - usedDays).toFixed(2)} ${editLeaveType} days remaining.`);
        return;
      }
    }

    onEditLeave(editingLeaveId, {
      type: editLeaveType,
      dateStart: editStartDate,
      dateEnd: editEndDate,
      days,
      reason: editReason || `${editLeaveType} Time Off`,
      status: 'Approved' // Keep it approved for simplicity in edit
    });

    setEditingLeaveId(null);
  };

  const sampleJsonString = JSON.stringify([
    {
      "name": "Summer Wellness Day",
      "date": "2026-08-20",
      "type": "Optional"
    },
    {
      "name": "Autumn Hackathon Kickoff",
      "date": "2026-10-02",
      "type": "Company"
    }
  ], null, 2);

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleJsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadSample = () => {
    const blob = new Blob([sampleJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'company_calendar_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseICS = (text: string): Omit<Holiday, 'id'>[] => {
    const lines = text.split(/\r?\n/);
    const events: Omit<Holiday, 'id'>[] = [];
    let currentEvent: Partial<Omit<Holiday, 'id'>> = {};
    let inEvent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("BEGIN:VEVENT")) {
        inEvent = true;
        currentEvent = {};
      } else if (line.startsWith("END:VEVENT")) {
        if (inEvent) {
          if (currentEvent.name && currentEvent.date) {
            events.push({
              name: currentEvent.name,
              date: currentEvent.date,
              type: currentEvent.type || 'Company',
            });
          }
          inEvent = false;
        }
      } else if (inEvent) {
        const match = line.match(/^([A-Z0-9-]+)(;[^:]+)?:(.*)$/i);
        if (match) {
          const name = match[1].toUpperCase();
          const value = match[3];

          if (name === "SUMMARY") {
            let cleanName = value.replace(/^[^\w\s]+/g, '').trim(); // strip leading emojis/symbols
            if (cleanName.toLowerCase().startsWith("holiday:")) {
              cleanName = cleanName.substring(8).trim();
            }
            cleanName = cleanName.replace(/\s*\((Mandatory|Optional|Company)\)$/i, '').trim();
            currentEvent.name = cleanName;
          } else if (name === "DTSTART") {
            const dateVal = value.split('T')[0];
            if (dateVal.length === 8) {
              const year = dateVal.substring(0, 4);
              const month = dateVal.substring(4, 6);
              const day = dateVal.substring(6, 8);
              currentEvent.date = `${year}-${month}-${day}`;
            }
          } else if (name === "DESCRIPTION") {
            if (/type:\s*(Mandatory|Optional|Company)/i.test(value)) {
              const typeMatch = value.match(/type:\s*(Mandatory|Optional|Company)/i);
              if (typeMatch) {
                const parsedType = typeMatch[1];
                currentEvent.type = (parsedType.charAt(0).toUpperCase() + parsedType.slice(1).toLowerCase()) as 'Mandatory' | 'Optional' | 'Company';
              }
            }
          }
        }
      }
    }
    return events;
  };

  const parseJSONCalendar = (text: string): Omit<Holiday, 'id'>[] => {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return data.filter(item => item.name && item.date).map(item => ({
          name: String(item.name),
          date: String(item.date),
          type: (item.type === 'Mandatory' || item.type === 'Optional' || item.type === 'Company') ? item.type : 'Company'
        }));
      }
    } catch (e) {
      console.error("JSON parse failed", e);
    }
    return [];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadError('');
    setParsedHolidays([]);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setUploadError('Failed to read file contents.');
        return;
      }

      let parsed: Omit<Holiday, 'id'>[] = [];
      if (file.name.endsWith('.ics')) {
        parsed = parseICS(text);
      } else if (file.name.endsWith('.json')) {
        parsed = parseJSONCalendar(text);
      } else {
        // Fallback, try both
        parsed = parseICS(text);
        if (parsed.length === 0) {
          parsed = parseJSONCalendar(text);
        }
      }

      if (parsed.length === 0) {
        setUploadError('Could not find any valid calendar events/holidays. Please verify the file format.');
      } else {
        setParsedHolidays(parsed);
      }
    };

    reader.onerror = () => {
      setUploadError('An error occurred while reading the file.');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImport = () => {
    if (parsedHolidays.length === 0) return;

    let finalHolidays: Holiday[] = [];
    if (importMode === 'replace') {
      finalHolidays = parsedHolidays.map((h, i) => ({
        id: `hol-uploaded-${Date.now()}-${i}`,
        ...h
      }));
    } else {
      // Merge
      finalHolidays = [...holidays];
      parsedHolidays.forEach((parsed, i) => {
        const exists = finalHolidays.some(h => 
          h.date === parsed.date && 
          h.name.toLowerCase().trim() === parsed.name.toLowerCase().trim()
        );
        if (!exists) {
          finalHolidays.push({
            id: `hol-uploaded-${Date.now()}-${i}`,
            ...parsed
          });
        }
      });
    }

    // Sort chronologically
    finalHolidays.sort((a, b) => a.date.localeCompare(b.date));

    onUploadHolidays(finalHolidays);
    setUploadSuccessMessage(`Successfully ${importMode === 'replace' ? 'replaced calendar with' : 'merged'} ${parsedHolidays.length} holidays!`);
    
    // Close modal & reset
    setIsUploadOpen(false);
    setParsedHolidays([]);
    setUploadError('');

    // Clear success message after 4s
    setTimeout(() => {
      setUploadSuccessMessage('');
    }, 4000);
  };

  // Circular calculations (r=34, circumference = 213.6)
  const CIRCUMFERENCE = 2 * Math.PI * 34;

  const categoryStats = categories.map(cat => {
    const used = leaves
      .filter(l => l.type === cat.name)
      .reduce((sum, curr) => sum + curr.days, 0);
    const percent = cat.total > 0 ? Math.min((used / cat.total) * 100, 100) : 0;
    const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    
    // Map text color to stroke color
    let strokeColor = '#6366f1'; // Primary
    if (cat.color.includes('rose')) strokeColor = '#f43f5e';
    if (cat.color.includes('emerald')) strokeColor = '#10b981';
    if (cat.color.includes('amber')) strokeColor = '#f59e0b';
    if (cat.color.includes('blue')) strokeColor = '#3b82f6';

    return { ...cat, used, percent, offset, strokeColor };
  });

  // Next holidays
  // Next holidays - Dynamic calculation based on current date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTime = new Date(todayStr).getTime();

  const futureHolidays = [...holidays].filter(h => {
    const [y, m, d] = h.date.split('-').map(Number);
    const hTime = new Date(y, m - 1, d).getTime();
    return hTime >= todayTime;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const nextHoliday = futureHolidays[0] || holidays[0] || null;
  const upcomingHolidays = nextHoliday ? futureHolidays.filter(h => h.id !== nextHoliday.id) : [];

  const getDaysRemaining = (dateStr: string) => {
    if (!dateStr) return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    const hTime = new Date(y, m - 1, d).getTime();
    const diffMs = hTime - todayTime;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nextHolidayDays = nextHoliday ? getDaysRemaining(nextHoliday.date) : 0;

  const getNextDayStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    return `${nextY}${nextM}${nextD}`;
  };

  // Sort schedule chronologically and filter by search query
  const sortedSchedule = [...leaves]
    .filter(leave => {
      const q = searchQuery.toLowerCase();
      return (
        leave.reason.toLowerCase().includes(q) ||
        leave.type.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

  // Handle ICS calendar file download simulation
  const handleExportCalendar = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);

    // Create a mock ICS string
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LeaveFlow//NONSGML v1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:LeaveFlow & Company Holidays 2026\nX-WR-TIMEZONE:Asia/Kolkata\n";
    
    // 1. Export Company Holidays
    holidays.forEach(h => {
      const dtstart = h.date.replace(/-/g, '');
      const dtend = getNextDayStr(h.date);
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:holiday-${h.id}@leaveflow.local\n`;
      icsContent += "SEQUENCE:0\n";
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "TRANSP:TRANSPARENT\n";
      icsContent += `SUMMARY:🇮🇳 Holiday: ${h.name} (${h.type})\n`;
      icsContent += `DTSTART;VALUE=DATE:${dtstart}\n`;
      icsContent += `DTEND;VALUE=DATE:${dtend}\n`;
      icsContent += `DESCRIPTION:Type: ${h.type} Company Holiday\n`;
      icsContent += "END:VEVENT\n";
    });

    // 2. Export Booked Leaves
    leaves.forEach(l => {
      const dtstart = l.dateStart.replace(/-/g, '');
      const dtend = getNextDayStr(l.dateEnd);
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `UID:leave-${l.id}@leaveflow.local\n`;
      icsContent += "SEQUENCE:0\n";
      icsContent += "STATUS:CONFIRMED\n";
      icsContent += "TRANSP:OPAQUE\n";
      icsContent += `SUMMARY:🌴 LeaveFlow: ${l.reason} (${l.type})\n`;
      icsContent += `DTSTART;VALUE=DATE:${dtstart}\n`;
      icsContent += `DTEND;VALUE=DATE:${dtend}\n`;
      icsContent += `DESCRIPTION:Status: ${l.status} | Type: ${l.type} Leave\n`;
      icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "leaveflow_company_calendar.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      
      <AnimatePresence>
        {uploadSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-xs overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-600 shrink-0" size={20} />
              <p className="text-sm font-bold">{uploadSuccessMessage}</p>
            </div>
            <button 
              onClick={() => setUploadSuccessMessage('')}
              className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100/50 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Welcome back</h2>
          <p className="text-base text-on-surface-variant font-medium">Here is your leave overview for the 2026 fiscal year.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportCalendar}
            className="flex w-full sm:w-auto items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant px-4 py-2.5 rounded-xl text-primary font-semibold text-sm hover:bg-surface-container-low transition-colors shadow-xs"
          >
            {exported ? (
              <>
                <Check size={18} className="text-green-600" />
                Calendar Synced!
              </>
            ) : (
              <>
                <CalendarDays size={18} />
                Sync
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {suggestionError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 mb-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl text-rose-800 text-sm font-medium flex items-center gap-3 shadow-sm"
          >
            <AlertTriangle size={18} className="text-rose-500" />
            {suggestionError}
          </motion.div>
        )}
      </AnimatePresence>

      <LeaveSuggestions 
        holidays={holidays} 
        leaves={leaves}
        onBookSuggestion={(startDate, endDate, reason) => {
          const days = calculateWorkDays(startDate, endDate);
          const category = categories.find(c => c.name === 'Accrued' || c.id === 'cat-accrued');
          
          if (category) {
            const usedDays = leaves
              .filter(l => l.type === category.name)
              .reduce((sum, curr) => sum + curr.days, 0);
            
            if (usedDays + days > category.total) {
              setSuggestionError(`Cannot book ${days} days. You only have ${(category.total - usedDays).toFixed(2)} ${category.name} days remaining.`);
              setTimeout(() => setSuggestionError(null), 4000);
              return;
            }
          }

          onAddLeave({
            type: category ? category.name : 'Accrued',
            dateStart: startDate,
            dateEnd: endDate,
            days,
            reason,
            status: 'Pending'
          });
        }} 
      />

      {/* KPI Circular Progress Cards */}
      <section className={`grid gap-6 ${
        categoryStats.length === 4 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-5xl' 
          : categoryStats.length === 2
          ? 'grid-cols-1 md:grid-cols-2 max-w-4xl'
          : categoryStats.length === 1
          ? 'grid-cols-1 max-w-sm'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}>
        {categoryStats.map(stat => (
          <div key={stat.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center gap-6 hover:-translate-y-1 transition-transform duration-300 relative group">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="transparent" stroke="#eff4ff" strokeWidth="8"></circle>
                <motion.circle 
                  initial={{ strokeDashoffset: CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: stat.offset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  cx="40" cy="40" r="34" 
                  fill="transparent" 
                  stroke={stat.strokeColor}
                  strokeWidth="8"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeLinecap="round"
                ></motion.circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-on-surface">
                {Math.round(stat.percent)}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold uppercase tracking-widest ${stat.color}`}>{stat.name}</p>
              </div>
              <h3 className="text-xl font-extrabold text-on-surface mt-0.5">
                {stat.used.toFixed(2)} <span className="text-xs font-medium text-on-surface-variant">/ {stat.total} used</span>
              </h3>
            </div>
          </div>
        ))}
      </section>

      {/* Holidays Layout Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            Upcoming Holidays
          </h3>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="py-1.5 px-3.5 bg-surface-container-low text-primary hover:bg-primary/10 rounded-xl font-bold text-xs transition-colors border border-outline-variant/30 flex items-center gap-1.5 shadow-xs"
          >
            <Upload size={13} />
            Upload Company Calendar
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Next Holiday Gradient Highlight Card */}
          <div className="md:col-span-1 bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl shadow-md text-white flex flex-col justify-between min-h-[175px] hover:scale-[1.01] transition-transform duration-300">
            {nextHoliday ? (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Next Holiday</p>
                  <h4 className="text-xl font-black tracking-tight mt-1 truncate" title={nextHoliday.name}>
                    {nextHoliday.name}
                  </h4>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {(() => {
                      const [y, m, d] = nextHoliday.date.split('-').map(Number);
                      const dateObj = new Date(y, m - 1, d);
                      return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    })()}
                  </p>
                  <span className="inline-block text-xs font-bold bg-white/20 px-3.5 py-1 rounded-full mt-2 animate-pulse">
                    {nextHolidayDays === 0 ? (
                      "Today!"
                    ) : nextHolidayDays === 1 ? (
                      "Tomorrow"
                    ) : (
                      `In ${nextHolidayDays} days`
                    )}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Next Holiday</p>
                  <h4 className="text-lg font-black tracking-tight mt-1">
                    No holidays scheduled
                  </h4>
                </div>
                <div>
                  <p className="text-xs font-medium opacity-80">Upload a team calendar (.ics or .json) to track company-wide off-days.</p>
                </div>
              </>
            )}
          </div>

          {/* Upcoming Holiday List (Dynamic Items) */}
          <div className="md:col-span-2 flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map(holiday => {
                const [year, month, day] = holiday.date.split('-').map(Number);
                const dateObj = new Date(year, month - 1, day);
                const monthAbbr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                const dayNum = dateObj.getDate();
                const weekDay = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                return (
                  <div 
                    key={holiday.id}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center text-primary shrink-0 font-bold">
                        <span className="text-[10px] tracking-wider">{monthAbbr}</span>
                        <span className="text-lg -mt-1">{dayNum}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">{holiday.name}</h4>
                        <p className="text-xs text-on-surface-variant font-medium">{weekDay}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        holiday.type === 'Optional'
                          ? 'bg-amber-100 text-amber-700'
                          : holiday.type === 'Company'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-primary-container/10 text-primary'
                      }`}>
                        {holiday.type}
                      </span>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setActiveHolidayMenuId(activeHolidayMenuId === holiday.id ? null : holiday.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeHolidayMenuId === holiday.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveHolidayMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-outline-variant shadow-lg rounded-xl py-1 z-20 overflow-hidden">
                              <button 
                                onClick={() => handleOpenEditHoliday(holiday)}
                                className="w-full text-left px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                              >
                                <Edit2 size={14} />
                                Edit Holiday
                              </button>
                              {onDeleteHoliday && (
                                <button 
                                  onClick={() => {
                                    onDeleteHoliday(holiday.id);
                                    setActiveHolidayMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface-variant h-full min-h-[175px]">
                <CalendarDays className="text-outline/40 mb-2" size={32} />
                <h4 className="text-sm font-bold text-on-surface">No Upcoming Holidays</h4>
                <p className="text-xs text-outline font-medium mt-1">Check back later or upload your team's custom calendar schedule.</p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Upcoming & Recent Schedule Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 shrink-0">
            <CalendarDays className="text-primary" size={20} />
            Upcoming &amp; Recent Schedule
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              <input 
                type="text" 
                placeholder="Search leaves by reason or type..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              />
            </div>

            {sortedSchedule.length > 0 && (
              <div className="relative shrink-0">
                {!confirmDeleteAll ? (
                  <button 
                    onClick={() => setConfirmDeleteAll(true)}
                    className="py-1.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors border border-rose-200 flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                  >
                    <Trash2 size={13} />
                    Delete All
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-100 px-2 py-1 rounded-xl border border-rose-300 shadow-sm animate-in fade-in slide-in-from-right-2">
                    <span className="text-xs font-bold text-rose-700 ml-1 whitespace-nowrap">Confirm delete?</span>
                    <button 
                      onClick={() => {
                        onDeleteAllLeaves();
                        setConfirmDeleteAll(false);
                      }}
                      className="py-1 px-2.5 bg-rose-600 text-white hover:bg-rose-700 rounded-lg font-bold text-xs transition-colors"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteAll(false)}
                      className="py-1 px-2.5 bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3" id="schedule-list">
          <AnimatePresence initial={false}>
            {sortedSchedule.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl text-on-surface-variant min-h-[150px]"
              >
                <CalendarDays className="text-outline/40 mb-2" size={32} />
                <h4 className="text-sm font-bold text-on-surface">No Leaves Found</h4>
                <p className="text-xs text-outline font-medium mt-1">
                  {searchQuery ? "Try adjusting your search filters." : "You have no upcoming leaves scheduled."}
                </p>
              </motion.div>
            ) : (
              sortedSchedule.map((leave, index) => {
                const [sYear, sMonth, sDay] = leave.dateStart.split('-').map(Number);
              const [eYear, eMonth, eDay] = leave.dateEnd.split('-').map(Number);
              
              const startDateObj = new Date(sYear, sMonth - 1, sDay);
              const endDateObj = new Date(eYear, eMonth - 1, eDay);
              
              const startMonth = startDateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const startDayNum = startDateObj.getDate();

              const endMonth = endDateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const endDayNum = endDateObj.getDate();

              const isSingleDay = leave.dateStart === leave.dateEnd;
              
              // Invoke the senior HR audit engine
              const audit = auditLeaveRequest(leave, holidays, leaves);
              const hasRisk = audit.isSuspected || audit.isCancelled;

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={leave.id}
                  className={`bg-surface-container-lowest border rounded-2xl p-4 flex items-center justify-between hover:border-primary-container transition-all group relative ${
                    audit.isCancelled 
                      ? 'border-red-200 bg-red-50/5' 
                      : audit.isSuspected 
                        ? 'border-rose-200' 
                        : 'border-outline-variant/30'
                  }`}
                >
                  {/* Left accent bar for HR risk/block */}
                  {audit.isCancelled ? (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-600 rounded-l-2xl"></div>
                  ) : audit.isSuspected ? (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l-2xl"></div>
                  ) : null}

                  <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                    
                    {/* Date Block */}
                    {isSingleDay ? (
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                        audit.isCancelled 
                          ? 'bg-red-50 text-red-600'
                          : audit.isSuspected 
                            ? 'bg-rose-50 text-rose-600' 
                            : 'bg-surface-container text-primary'
                      }`}>
                        <span className="text-[10px] tracking-wider">{startMonth}</span>
                        <span className="text-lg -mt-1">{startDayNum}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${
                          audit.isCancelled ? 'bg-red-50 text-red-600' : 'bg-primary-container/10 text-primary'
                        }`}>
                          <span className="text-[10px] tracking-wider">{startMonth}</span>
                          <span className="text-lg -mt-1">{startDayNum}</span>
                        </div>
                        <div className="h-px w-6 bg-outline-variant"></div>
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold ${
                          audit.isCancelled ? 'bg-red-50 text-red-600' : 'bg-primary-container/10 text-primary'
                        }`}>
                          <span className="text-[10px] tracking-wider">{endMonth}</span>
                          <span className="text-lg -mt-1">{endDayNum}</span>
                        </div>
                      </div>
                    )}

                    <div className="ml-2">
                      <h4 className="text-sm font-bold text-on-surface flex flex-wrap items-center gap-2">
                        {leave.type} ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                        {audit.isCancelled && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-red-100 text-red-700 font-black rounded uppercase tracking-wider">
                            Policy Blocked
                          </span>
                        )}
                        {audit.isSuspected && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-amber-100 text-amber-700 font-black rounded uppercase tracking-wider">
                            Flagged for Audit
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium">{leave.reason}</p>
                      
                      {/* HR Audit policy violation / suspicion descriptions */}
                      {audit.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {audit.flags.map((flag, idx) => (
                            <span 
                              key={idx}
                              className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                flag.type === 'critical'
                                  ? 'bg-red-50 text-red-700 border border-red-100'
                                  : flag.type === 'warning'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              }`}
                            >
                              • {flag.rule}: {flag.message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="flex items-center gap-3">
                    {/* Badges */}
                    {audit.isCancelled ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-black shrink-0">
                        <AlertTriangle size={12} className="text-red-600" />
                        Disapproved / Auto-Cancelled
                      </div>
                    ) : audit.isSuspected ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold shrink-0 animate-pulse">
                        <AlertTriangle size={12} />
                        Risk Score: {audit.riskScore}%
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                        Safe
                      </span>
                    )}

                    {/* Action dropdown/trash button */}
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === leave.id ? null : leave.id)}
                        className="p-1 rounded-lg text-on-surface-variant/70 hover:bg-surface-container-low transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === leave.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-40 bg-surface-container-lowest border border-outline-variant shadow-lg rounded-xl py-1 z-20 overflow-hidden">
                            <button 
                              onClick={() => handleOpenEditLeave(leave)}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <Edit2 size={14} />
                              Edit Booking
                            </button>
                            <button 
                              onClick={() => {
                                onDeleteLeave(leave.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Cancel Booking
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
            }))}
          </AnimatePresence>
        </div>
      </section>

      {/* Floating Action Button (FAB) (Matches Screenshot 3) */}
      <button 
        onClick={openBookingModal}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-16 h-16 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center group z-40"
        title="Book Time Off"
      >
        <Plus size={32} />
        <span className="absolute right-full mr-4 bg-on-surface text-white px-3 py-1.5 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
          Book Time Off
        </span>
      </button>

      {/* Upload Company Calendar Modal Dialog */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsUploadOpen(false);
                setParsedHolidays([]);
                setUploadError('');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[85vh] overflow-hidden z-10 m-4"
            >
              {/* Header */}
              <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-on-surface">Upload Company Calendar</h3>
                  <p className="text-xs text-on-surface-variant font-medium mt-1">Import holidays and company events (.ics or .json formats)</p>
                </div>
                <button
                  onClick={() => {
                    setIsUploadOpen(false);
                    setParsedHolidays([]);
                    setUploadError('');
                  }}
                  className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                
                {/* Drag and Drop Zone */}
                {parsedHolidays.length === 0 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                      dragOver
                        ? 'border-primary bg-primary/5 scale-[0.99]'
                        : 'border-outline-variant hover:border-primary bg-surface-container-lowest'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Upload size={28} />
                    </div>
                    <h4 className="text-sm font-bold text-on-surface">Drag & drop your calendar file here</h4>
                    <p className="text-xs text-on-surface-variant font-medium mt-1 mb-4">
                      iCalendar (.ics) or JSON structured data
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <label className="py-2 px-4 bg-primary text-white hover:bg-primary-hover rounded-xl font-bold text-xs cursor-pointer shadow-xs transition-colors">
                        Choose File
                        <input
                          type="file"
                          accept=".ics,.json"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = [
                            { name: "Summer Wellness Day", date: "2026-08-20", type: "Optional" as const },
                            { name: "Autumn Hackathon Kickoff", date: "2026-10-02", type: "Company" as const },
                            { name: "Winter Solstice Rest", date: "2026-12-21", type: "Mandatory" as const }
                          ];
                          setParsedHolidays(sample);
                          setUploadError('');
                        }}
                        className="py-2 px-4 bg-surface-container-low text-primary hover:bg-primary/10 rounded-xl font-bold text-xs transition-colors border border-outline-variant/30"
                      >
                        Try with Sample Data
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Parsing Summary */
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <Check size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-800">File Loaded Successfully</h4>
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5">Found {parsedHolidays.length} holiday events ready to import.</p>
                      </div>
                    </div>

                    {/* Scrollable list of parsed holidays */}
                    <div className="border border-outline-variant/40 rounded-2xl overflow-hidden">
                      <div className="bg-surface-container-low px-4 py-2.5 text-xs font-bold text-on-surface-variant border-b border-outline-variant/30 flex justify-between">
                        <span>HOLIDAY NAME & DATE</span>
                        <span>TYPE</span>
                      </div>
                      <div className="max-h-[180px] overflow-y-auto divide-y divide-outline-variant/10 bg-surface-container-lowest custom-scrollbar">
                        {parsedHolidays.map((item, index) => {
                          const [y, m, d] = item.date.split('-').map(Number);
                          const dateObj = new Date(y, m - 1, d);
                          const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <div key={index} className="px-4 py-2.5 flex items-center justify-between hover:bg-surface-container-low/35 transition-colors">
                              <div>
                                <h5 className="text-xs font-bold text-on-surface">{item.name}</h5>
                                <span className="text-[10px] text-on-surface-variant font-medium">{formattedDate}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.type === 'Optional'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                  : item.type === 'Company'
                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                    : 'bg-primary-container/10 text-primary border border-primary/10'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Import Action / Mode choice */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-on-surface">Import Mode</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setImportMode('merge')}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                            importMode === 'merge'
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-outline-variant hover:border-on-surface-variant/40 bg-surface-container-lowest'
                          }`}
                        >
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              importMode === 'merge' ? 'border-primary text-primary' : 'border-outline-variant'
                            }`}>
                              {importMode === 'merge' && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
                            </span>
                            Merge Calendar
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">
                            Keep existing holidays, only adding new unique dates.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setImportMode('replace')}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                            importMode === 'replace'
                              ? 'border-rose-500 bg-rose-50/10 ring-1 ring-rose-500'
                              : 'border-outline-variant hover:border-on-surface-variant/40 bg-surface-container-lowest'
                          }`}
                        >
                          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                              importMode === 'replace' ? 'border-rose-500 text-rose-500' : 'border-outline-variant'
                            }`}>
                              {importMode === 'replace' && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />}
                            </span>
                            Overwrite Calendar
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">
                            Replace current holidays list entirely with these new dates.
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {uploadError && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={16} />
                    <div>
                      <h4 className="text-xs font-bold text-rose-800">Error Parsing File</h4>
                      <p className="text-xs text-rose-600 font-medium mt-0.5">{uploadError}</p>
                    </div>
                  </div>
                )}

                {/* Helpful Formats Hint */}
                {parsedHolidays.length === 0 && (
                  <div className="space-y-4">
                    <div className="bg-surface-container-low rounded-2xl p-4 space-y-2">
                      <h5 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                        <FileText size={14} className="text-primary" />
                        Supported Formats Guidelines:
                      </h5>
                      <ul className="list-disc pl-4 text-[11px] text-on-surface-variant font-medium space-y-1">
                        <li><strong>iCalendar (.ics)</strong>: Exported from Google Calendar, Microsoft Outlook, or Apple Calendar.</li>
                        <li><strong>JSON structure</strong>: An array of objects containing <code className="bg-surface-container px-1 py-0.5 rounded">name</code>, <code className="bg-surface-container px-1 py-0.5 rounded">date</code> (YYYY-MM-DD), and optional <code className="bg-surface-container px-1 py-0.5 rounded">type</code>.</li>
                      </ul>
                    </div>

                    <div className="border border-outline-variant/30 rounded-2xl bg-surface-container-lowest overflow-hidden">
                      <div className="bg-surface-container-low px-4 py-2.5 text-xs font-bold text-on-surface-variant border-b border-outline-variant/30 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-mono">
                          <code className="text-primary text-[11px]">company_calendar.json</code> (Sample Template)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleCopySample}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                              copied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-on-surface hover:bg-surface-container-low border-outline-variant'
                            }`}
                          >
                            {copied ? <Check size={11} /> : <Copy size={11} />}
                            {copied ? 'Copied!' : 'Copy Code'}
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadSample}
                            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-white text-on-surface hover:bg-surface-container-low border border-outline-variant transition-colors flex items-center gap-1"
                          >
                            <Download size={11} />
                            Download Template
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-950 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed max-h-[160px] custom-scrollbar selection:bg-primary/30">
                        <pre>{sampleJsonString}</pre>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-outline-variant/30 bg-surface-container-low/40 flex items-center justify-end gap-3">
                {parsedHolidays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setParsedHolidays([]);
                      setUploadError('');
                    }}
                    className="py-2.5 px-4 bg-white border border-outline-variant hover:bg-surface-container text-on-surface rounded-xl font-bold text-xs transition-colors"
                  >
                    Clear File
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setParsedHolidays([]);
                    setUploadError('');
                  }}
                  className="py-2.5 px-4 bg-white border border-outline-variant hover:bg-surface-container text-on-surface rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                {parsedHolidays.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImport}
                    className={`py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-colors shadow-xs ${
                      importMode === 'replace'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-primary hover:bg-primary-hover'
                    }`}
                  >
                    Confirm & Import
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Leave Dialog */}
      <AnimatePresence>
        {editingLeaveId && (
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Edit2 className="text-primary" size={20} />
                  Edit Time Off
                </h3>
                <button onClick={() => setEditingLeaveId(null)} className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEditLeave} className="p-6 space-y-4">
                {editError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    {editError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Leave Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditLeaveType(cat.name)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          editLeaveType === cat.name 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'bg-white text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-low'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">Start Date</label>
                    <input 
                      type="date" 
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">End Date</label>
                    <input 
                      type="date" 
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">Reason / Notes</label>
                  <textarea 
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="e.g. Vacation Trip, Rest day"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingLeaveId(null)}
                    className="flex-1 py-2.5 px-4 bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/30 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-primary text-white hover:bg-primary-container rounded-xl font-semibold text-sm transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Holiday Dialog */}
      <AnimatePresence>
        {editingHolidayId && (
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Edit2 className="text-primary" size={20} />
                  Edit Holiday
                </h3>
                <button onClick={() => setEditingHolidayId(null)} className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveEditHoliday} className="p-6 space-y-4">
                {editHolidayError && (
                  <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    {editHolidayError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">Name</label>
                  <input 
                    type="text" 
                    value={editHolidayName}
                    onChange={(e) => setEditHolidayName(e.target.value)}
                    placeholder="e.g. New Year's Day"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={editHolidayDate}
                    onChange={(e) => setEditHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Holiday Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Company', 'Mandatory', 'Optional'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditHolidayType(type)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                          editHolidayType === type 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : 'bg-white text-on-surface-variant border-outline-variant/60 hover:bg-surface-container-low'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingHolidayId(null)}
                    className="flex-1 py-2.5 px-4 bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/30 rounded-xl font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-primary text-white hover:bg-primary-container rounded-xl font-semibold text-sm transition-colors shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
