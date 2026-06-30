import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Holiday, LeaveRequest } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auditLeaveRequest } from '../utils';

interface CalendarViewProps {
  leaves: LeaveRequest[];
  holidays: Holiday[];
}

export default function CalendarView({ leaves, holidays }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => {
    setDirection(1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setDirection(-1);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper to get events for a day
  const getDayEvents = (day: number) => {
    const events: { title: string; type: string; status?: string; isHoliday: boolean; hasRisk?: boolean }[] = [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Add holidays
    holidays.forEach(holiday => {
      if (holiday.date === dateStr) {
        events.push({ title: holiday.name, type: holiday.type, isHoliday: true });
      }
    });

    // Add leaves
    leaves.forEach(leave => {
      const start = new Date(leave.dateStart);
      const end = new Date(leave.dateEnd);
      const current = new Date(dateStr);
      
      // Reset times for accurate date comparison
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      current.setHours(0,0,0,0);

      if (current >= start && current <= end) {
        // Exclude weekends if they are not counted as leaves in this context
        // We'll keep it simple: if it's within date range, show it.
        const isWeekend = current.getDay() === 0 || current.getDay() === 6;
        if (!isWeekend) {
           const audit = auditLeaveRequest(leave, holidays, leaves);
           const hasRisk = audit.isSuspected || audit.isCancelled;
           events.push({ title: leave.reason || `${leave.type} Leave`, type: leave.type, status: leave.status, isHoliday: false, hasRisk });
        }
      }
    });

    return events;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-on-surface flex items-center gap-2">
            <CalendarIcon className="text-primary" />
            Calendar
          </h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            View your upcoming leaves and company holidays.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-on-surface">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div 
              key={currentDate.toISOString()}
              custom={direction}
              initial={{ opacity: 0, x: direction * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-px bg-outline-variant/30 rounded-xl overflow-hidden border border-outline-variant/30"
            >
              {/* Weekday headers */}
              {weekDays.map(day => (
                <div key={day} className="bg-surface-container-lowest py-3 text-center text-xs font-bold uppercase text-on-surface-variant">
                  {day}
                </div>
              ))}

              {/* Empty cells for start of month */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-surface-container-lowest/50 min-h-[100px] p-2" />
              ))}

              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = getDayEvents(day);
                const isToday = 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() && 
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div 
                    key={day} 
                    className={`bg-surface-container-lowest min-h-[100px] p-2 border-t border-outline-variant/30 transition-colors hover:bg-surface-container-low/50 ${
                      isToday ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isToday ? 'bg-primary text-white' : 'text-on-surface-variant'
                      }`}>
                        {day}
                      </span>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {events.map((event, idx) => (
                        <div 
                          key={idx} 
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold leading-tight flex flex-col gap-1 ${
                            event.isHoliday
                              ? event.type === 'Optional'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : event.type === 'Company'
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-primary-container/10 text-primary border border-primary/20'
                              : !event.hasRisk
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200' // Pending / needs HR approval
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                             <span className="truncate">{event.title}</span>
                             {!event.isHoliday && (
                               !event.hasRisk ? (
                                 <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                               ) : (
                                 <AlertCircle size={12} className="shrink-0 text-rose-600" />
                               )
                             )}
                          </div>
                          {!event.isHoliday && (
                            <span className="opacity-80 font-semibold">{!event.hasRisk ? 'Good to take' : 'Pending HR'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></div>
            <span>Approved / Good to take</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300"></div>
            <span>Pending HR Approval</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-300"></div>
            <span>Company Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300"></div>
            <span>Optional Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-container/10 border border-primary/20"></div>
            <span>Mandatory Holiday</span>
          </div>
        </div>
      </div>
    </div>
  );
}
