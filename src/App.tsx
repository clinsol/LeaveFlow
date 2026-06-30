import React, { useState, useEffect } from 'react';
import { LeaveRequest, Holiday, LeaveCategory } from './types';
import { INITIAL_LEAVES, HOLIDAYS, DEFAULT_CATEGORIES } from './data';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import { generateCalendarGrid, calculateWorkDays, auditLeaveRequest } from './utils';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Calendar, X, RefreshCw, Check, Bot, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Navigation Tabs state: Dashboard (Default), Calendar, Settings
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Calendar' | 'Settings'>('Dashboard');
  
  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Holidays state (persists in localStorage)
  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('leaveflow_holidays_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved holidays', e);
      }
    }
    return HOLIDAYS;
  });

  // Sync holidays with localStorage
  useEffect(() => {
    localStorage.setItem('leaveflow_holidays_v1', JSON.stringify(holidays));
  }, [holidays]);

  // Leaves state (persists in localStorage)
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('leaveflow_leaves_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved leaves', e);
      }
    }
    return INITIAL_LEAVES;
  });

  // Sync leaves with localStorage
  useEffect(() => {
    localStorage.setItem('leaveflow_leaves_v1', JSON.stringify(leaves));
  }, [leaves]);

  // Global booking state for Dashboard FAB transition
  const [globalOpenBooking, setGlobalOpenBooking] = useState(false);

  // Dynamic leave categories state
  const [categories, setCategories] = useState<LeaveCategory[]>(() => {
    const saved = localStorage.getItem('leaveflow_categories_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved categories', e);
      }
    }
    return DEFAULT_CATEGORIES;
  });

  // Sync categories with localStorage
  useEffect(() => {
    localStorage.setItem('leaveflow_categories_v1', JSON.stringify(categories));
  }, [categories]);

  const handleAddCategory = (category: Omit<LeaveCategory, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: `cat-${Date.now()}` }]);
  };

  const handleUpdateCategory = (id: string, category: Omit<LeaveCategory, 'id'>) => {
    // Before updating, see if name changed, update existing leaves to match new name
    setCategories(prev => {
      const oldCat = prev.find(c => c.id === id);
      if (oldCat && oldCat.name !== category.name) {
        setLeaves(oldLeaves => oldLeaves.map(l => l.type === oldCat.name ? { ...l, type: category.name } : l));
      }
      return prev.map(c => c.id === id ? { ...c, ...category } : c);
    });
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };


  // Add leave booking helper
  const handleAddLeave = (newLeave: Omit<LeaveRequest, 'id'>) => {
    const id = `leave-${Date.now()}`;
    const leaveWithId: LeaveRequest = {
      ...newLeave,
      id
    };
    setLeaves(prev => [...prev, leaveWithId]);

    // Trigger subtle, corporate-colored confetti burst
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#6366f1']
    });
  };

  // Edit leave booking helper
  const handleEditLeave = (id: string, updatedLeave: Omit<LeaveRequest, 'id'>) => {
    setLeaves(prev => prev.map(l => (l.id === id ? { ...updatedLeave, id } : l)));
  };

  // Delete leave booking helper
  const handleDeleteLeave = (id: string) => {
    setLeaves(prev => prev.filter(l => l.id !== id));
  };

  const handleDeleteAllLeaves = () => {
    setLeaves([]);
  };

  const handleEditHoliday = (id: string, updatedHoliday: Omit<Holiday, 'id'>) => {
    setHolidays(prev => prev.map(h => (h.id === id ? { ...updatedHoliday, id } : h)));
  };

  const handleDeleteHoliday = (id: string) => {
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  // Triggers booking modal when called from Dashboard FAB
  const triggerDashboardBooking = () => {
    setGlobalOpenBooking(true);
  };

  const handleResetAllData = () => {
    setLeaves([]);
    setCategories(DEFAULT_CATEGORIES);
    setHolidays(HOLIDAYS);
    localStorage.removeItem('leaveflow_leaves_v1');
    localStorage.removeItem('leaveflow_categories_v1');
    localStorage.removeItem('leaveflow_holidays_v1');
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-28 md:pb-12 antialiased selection:bg-primary/20">
      
      {/* Navigation Layout */}
      <Navbar activeTab={activeTab} setActiveTab={(tab) => {
        setActiveTab(tab);
        setGlobalOpenBooking(false); // Reset global trigger
      }} />

      {/* Main Body Stage */}
      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-6">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="pb-16"
          >
            {activeTab === 'Dashboard' && (
              <DashboardView 
                leaves={leaves}
                onAddLeave={handleAddLeave}
                onEditLeave={handleEditLeave}
                onDeleteLeave={handleDeleteLeave}
                onDeleteAllLeaves={handleDeleteAllLeaves}
                openBookingModal={triggerDashboardBooking}
                categories={categories}
                holidays={holidays}
                onUploadHolidays={setHolidays}
                onEditHoliday={handleEditHoliday}
                onDeleteHoliday={handleDeleteHoliday}
              />
            )}

            {activeTab === 'Calendar' && (
              <CalendarView 
                leaves={leaves}
                holidays={holidays}
              />
            )}

            {activeTab === 'Settings' && (
              <SettingsView 
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onResetAllData={handleResetAllData}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Footer signature */}
      <footer className="w-full text-center py-6 pb-24 md:pb-8 text-xs text-on-surface-variant/60 font-medium border-t border-outline-variant/20">
        <p>© {new Date().getFullYear()} Created by Roshan. All rights reserved.</p>
      </footer>

      {/* Global Booking Dialog Bridge (triggered from Dashboard FAB) */}
      {globalOpenBooking && (
        <GlobalBookingBridge 
          selectedDate={selectedDate}
          onAddLeave={handleAddLeave}
          onClose={() => setGlobalOpenBooking(false)}
          categories={categories}
          leaves={leaves}
          holidays={holidays}
        />
      )}

    </div>
  );
}

/* Helper Component for direct Dashboard-to-Calendar booking transition bridge */
interface BridgeProps {
  selectedDate: string;
  onAddLeave: (leave: Omit<LeaveRequest, 'id'>) => void;
  onClose: () => void;
  categories: LeaveCategory[];
  leaves: LeaveRequest[];
  holidays: Holiday[];
}

function GlobalBookingBridge({ selectedDate, onAddLeave, onClose, categories, leaves, holidays }: BridgeProps) {
  const [leaveType, setLeaveType] = useState<string>(categories[0]?.name || 'Accrued');
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = calculateWorkDays(startDate, endDate);
    if (days <= 0) {
      setError('Date range is invalid or only contains weekends.');
      return;
    }

    // Validation for limits
    const category = categories.find(c => c.name === leaveType);
    if (category) {
      const usedDays = leaves
        .filter(l => l.type === leaveType)
        .reduce((sum, curr) => sum + curr.days, 0);
      
      if (usedDays + days > category.total) {
        setError(`Cannot book ${days} days. You only have ${(category.total - usedDays).toFixed(2)} ${leaveType} days remaining.`);
        return;
      }
    }

    onAddLeave({
      type: leaveType,
      dateStart: startDate,
      dateEnd: endDate,
      days,
      reason: reason || `${leaveType} Time Off`,
      status: 'Approved'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Calendar className="text-primary" size={20} />
            Quick Book Time Off
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-2">Leave Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setLeaveType(cat.name)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                    leaveType === cat.name 
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">Reason / Notes</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Vacation Trip, Rest day"
              className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
            />
          </div>

          {startDate && endDate && (
            (() => {
              const liveAudit = auditLeaveRequest({ type: leaveType, dateStart: startDate, dateEnd: endDate, reason }, holidays, leaves);
              return (
                <div className={`p-3.5 rounded-xl border text-xs font-medium space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 ${
                  liveAudit.isCancelled 
                    ? 'bg-red-50/50 border-red-200 text-red-900' 
                    : liveAudit.isSuspected 
                      ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
                      : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                    <Bot size={14} className={liveAudit.isCancelled ? 'text-red-600' : liveAudit.isSuspected ? 'text-amber-600' : 'text-emerald-600'} />
                    Senior HR Policy Assessment
                  </div>
                  <div className="mt-1">
                    {liveAudit.isCancelled ? (
                      <div>
                        <span className="font-extrabold text-red-700">Violation Found:</span> This request violates active HR rules and will be auto-cancelled / blocked:
                        <ul className="list-disc pl-4 mt-1 text-[11px] font-medium text-red-800 space-y-1">
                          {liveAudit.flags.map((f, i) => <li key={i}><strong>{f.rule}:</strong> {f.message}</li>)}
                        </ul>
                      </div>
                    ) : liveAudit.isSuspected ? (
                      <div>
                        <span className="font-bold text-amber-800">Flag Alert:</span> This booking will be flagged for secondary review (Risk Score: {liveAudit.riskScore}%):
                        <ul className="list-disc pl-4 mt-1 text-[11px] font-medium text-amber-800 space-y-1">
                          {liveAudit.flags.map((f, i) => <li key={i}><strong>{f.rule}:</strong> {f.message}</li>)}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-emerald-800 text-[11px]">
                        ✓ Compliant booking window and details. No audit warnings or flags identified.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/30 rounded-xl font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-primary text-white hover:bg-primary-container rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              Book Time Off
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
