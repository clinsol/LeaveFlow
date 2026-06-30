import React from 'react';
import { 
  LayoutGrid, 
  Settings as SettingsIcon,
  CalendarDays,
  Palmtree
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'Dashboard' | 'Calendar' | 'Settings';
  setActiveTab: (tab: 'Dashboard' | 'Calendar' | 'Settings') => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  return (
    <>
      {/* Top Header App Bar (Matches Desktop and Mobile Header) */}
      <header className="sticky top-0 bg-surface-container-lowest border-b border-outline-variant/30 w-full z-40 transition-all duration-300 shadow-xs">
        <div className="flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-7xl mx-auto">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/15 transition-transform hover:scale-105 duration-250 cursor-pointer" onClick={() => setActiveTab('Dashboard')}>
              <Palmtree size={20} className="stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-primary select-none cursor-pointer" onClick={() => setActiveTab('Dashboard')}>
              LeaveFlow
            </h1>
          </div>

          {/* Desktop Navigation Link Tabs */}
          <div className="hidden md:flex gap-8">
            <button 
              onClick={() => setActiveTab('Dashboard')}
              className={`font-semibold text-sm transition-colors py-1 relative ${
                activeTab === 'Dashboard' 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Dashboard
              {activeTab === 'Dashboard' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>

            <button 
              onClick={() => setActiveTab('Calendar')}
              className={`font-semibold text-sm transition-colors py-1 relative ${
                activeTab === 'Calendar' 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Calendar
              {activeTab === 'Calendar' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>

            <button 
              onClick={() => setActiveTab('Settings')}
              className={`font-semibold text-sm transition-colors py-1 relative ${
                activeTab === 'Settings' 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Settings
              {activeTab === 'Settings' && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Spacer to align Desktop Links beautifully if there is no end profile */}
          <div className="hidden md:block w-10 h-10" aria-hidden="true" />

        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar (Matches Screenshot Bottom Navs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-around items-center px-4 py-3 bg-surface-container-lowest border-t border-outline-variant/30 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] rounded-t-2xl pb-safe">
        
        {/* Dashboard Link */}
        <button 
          onClick={() => setActiveTab('Dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${
            activeTab === 'Dashboard' 
              ? 'bg-primary-container/10 text-primary font-bold' 
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <LayoutGrid size={20} />
          <span className="text-[10px] mt-0.5 font-semibold tracking-wider uppercase">Dashboard</span>
        </button>

        {/* Calendar Link */}
        <button 
          onClick={() => setActiveTab('Calendar')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${
            activeTab === 'Calendar' 
              ? 'bg-primary-container/10 text-primary font-bold' 
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <CalendarDays size={20} />
          <span className="text-[10px] mt-0.5 font-semibold tracking-wider uppercase">Calendar</span>
        </button>

        {/* Settings Link */}
        <button 
          onClick={() => setActiveTab('Settings')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${
            activeTab === 'Settings' 
              ? 'bg-primary-container/10 text-primary font-bold' 
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <SettingsIcon size={20} />
          <span className="text-[10px] mt-0.5 font-semibold tracking-wider uppercase">Settings</span>
        </button>

      </nav>
    </>
  );
}
