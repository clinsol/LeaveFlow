import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, CalendarDays } from 'lucide-react';
import { Holiday, LeaveRequest } from '../types';

interface LeaveSuggestionsProps {
  holidays: Holiday[];
  leaves: LeaveRequest[];
  onBookSuggestion: (startDate: string, endDate: string, reason: string) => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  daysToTake: number;
  totalDaysOff: number;
  holidayName: string;
}

export default function LeaveSuggestions({ holidays, leaves, onBookSuggestion }: LeaveSuggestionsProps) {
  const suggestions = useMemo(() => {
    const suggs: Suggestion[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort holidays chronologically
    const upcomingHolidays = [...holidays]
      .filter(h => new Date(h.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    upcomingHolidays.forEach(holiday => {
      const hDate = new Date(holiday.date);
      const dayOfWeek = hDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) return;

      // Suggestion based on day of week
      if (dayOfWeek === 2) { // Tuesday -> take Monday off
        const monday = new Date(hDate);
        monday.setDate(hDate.getDate() - 1);
        
        suggs.push({
          id: `sugg-mon-${holiday.id}`,
          title: `Make it a 4-day weekend!`,
          description: `Take Monday off before ${holiday.name} to get a 4-day long weekend.`,
          startDate: monday.toISOString().split('T')[0],
          endDate: monday.toISOString().split('T')[0],
          daysToTake: 1,
          totalDaysOff: 4,
          holidayName: holiday.name
        });
      } else if (dayOfWeek === 4) { // Thursday -> take Friday off
        const friday = new Date(hDate);
        friday.setDate(hDate.getDate() + 1);
        
        suggs.push({
          id: `sugg-fri-${holiday.id}`,
          title: `Make it a 4-day weekend!`,
          description: `Take Friday off after ${holiday.name} to get a 4-day long weekend.`,
          startDate: friday.toISOString().split('T')[0],
          endDate: friday.toISOString().split('T')[0],
          daysToTake: 1,
          totalDaysOff: 4,
          holidayName: holiday.name
        });
      } else if (dayOfWeek === 3) { // Wednesday -> take Mon-Tue or Thu-Fri
        const thu = new Date(hDate);
        thu.setDate(hDate.getDate() + 1);
        const fri = new Date(hDate);
        fri.setDate(hDate.getDate() + 2);
        
        suggs.push({
          id: `sugg-thufri-${holiday.id}`,
          title: `Get 5 days off using 2 leaves`,
          description: `Take Thursday and Friday off after ${holiday.name} to get 5 continuous days off.`,
          startDate: thu.toISOString().split('T')[0],
          endDate: fri.toISOString().split('T')[0],
          daysToTake: 2,
          totalDaysOff: 5,
          holidayName: holiday.name
        });
      } else if (dayOfWeek === 1 || dayOfWeek === 5) {
         // Monday or Friday -> already a 3 day weekend. 
         // Could suggest taking 4 days for a 9 day week, but keep it simple for now.
      }
    });

    // Filter out suggestions where the user already has leave
    return suggs.filter(s => {
      const sStart = new Date(s.startDate);
      const sEnd = new Date(s.endDate);
      
      const overlap = leaves.some(l => {
        const lStart = new Date(l.dateStart);
        const lEnd = new Date(l.dateEnd);
        return (sStart <= lEnd && sEnd >= lStart);
      });
      
      return !overlap;
    }).slice(0, 3); // Max 3 suggestions
  }, [holidays, leaves]);

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
        <Sparkles className="text-amber-500" size={20} />
        Smart Leave Suggestions
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {suggestions.map((sugg, i) => (
          <motion.div
            key={sugg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-container-lowest border border-outline-variant/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                    {sugg.holidayName}
                  </span>
                </div>
                <h4 className="text-base font-bold text-on-surface leading-tight mb-2">
                  {sugg.title}
                </h4>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-4">
                  {sugg.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-outline-variant/30">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-outline">COST / GAIN</span>
                  <span className="text-sm font-bold text-on-surface">
                    {sugg.daysToTake} {sugg.daysToTake === 1 ? 'day' : 'days'} → <span className="text-emerald-600">{sugg.totalDaysOff} days</span>
                  </span>
                </div>
                <button 
                  onClick={() => onBookSuggestion(sugg.startDate, sugg.endDate, `Extended weekend for ${sugg.holidayName}`)}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  Book Now
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
