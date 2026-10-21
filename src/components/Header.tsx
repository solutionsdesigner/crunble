import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, User as UserIcon, Bell, LogOut, LogIn } from 'lucide-react';
import { TimeZoneOption, ViewMode, User } from '../types';
import { TIMEZONE_OPTIONS, formatTimeInZone, formatDateInZone } from '../utils/timezones';

interface HeaderProps {
  currentTimeZone: TimeZoneOption;
  onTimeZoneChange: (tz: TimeZoneOption) => void;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (dateStr: string) => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  completedCount: number;
  activeCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  notificationsEnabled: boolean;
  notificationLeadMinutes: number;
  onToggleNotifications: (enabled: boolean) => void;
  onUpdateLeadMinutes: (minutes: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTimeZone,
  onTimeZoneChange,
  selectedDate,
  onDateChange,
  currentView,
  onViewChange,
  completedCount,
  activeCount,
  currentUser,
  onOpenAuth,
  onLogout,
  notificationsEnabled,
  notificationLeadMinutes,
  onToggleNotifications,
  onUpdateLeadMinutes,
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [isTzDropdownOpen, setIsTzDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const tzRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tzRef.current && !tzRef.current.contains(e.target as Node)) {
        setIsTzDropdownOpen(false);
      }
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setIsCalendarDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [calYear, setCalYear] = useState<number>(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[0], 10) : new Date().getFullYear();
  });
  const [calMonth, setCalMonth] = useState<number>(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();

  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectGoalDate = (day: number) => {
    const formatted = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateChange(formatted);
    setIsCalendarDropdownOpen(false);
  };

  const formattedTime = formatTimeInZone(now, currentTimeZone.iana);
  const formattedDisplayDate = formatDateInZone(
    new Date(selectedDate + 'T12:00:00'),
    currentTimeZone.iana
  );

  return (
    <header className="w-full bg-[#faf7f2] pt-3 pb-3 px-4 sm:px-10 border-b border-[#e8e4db] flex-shrink-0 relative">
      <div className="max-w-6xl mx-auto flex flex-col gap-2.5">
        {/* Line 1: Brand, Time, Timezone, and Date strictly on the SAME LINE (nowrap) */}
        <div className="flex items-center flex-nowrap whitespace-nowrap overflow-x-auto no-scrollbar gap-2 sm:gap-3 text-xs sm:text-sm text-[#1a1a1a] py-0.5">
          <button
            type="button"
            onClick={() => onViewChange('timeline')}
            className="text-xs sm:text-sm font-semibold tracking-tight uppercase text-[#1a1a1a] hover:opacity-75 transition-opacity flex-shrink-0"
            title="Cronble Timeline"
          >
            Cronble
          </button>

          <span className="font-mono-nums text-xs sm:text-sm font-normal text-[#1a1a1a] flex-shrink-0">
            {formattedTime}
          </span>

          {/* Timezone shorthand dropdown */}
          <div className="relative inline-block flex-shrink-0" ref={tzRef}>
            <button
              type="button"
              onClick={() => setIsTzDropdownOpen(!isTzDropdownOpen)}
              className="text-[11px] sm:text-xs uppercase font-mono-nums text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 inline-flex items-center gap-0.5"
            >
              <span>{currentTimeZone.shorthand}</span>
              <ChevronDown className="w-3 h-3 stroke-[1.5]" />
            </button>

            {isTzDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-[#f4f0e8] z-50 p-2 border-b border-[#1a1a1a] max-h-72 overflow-y-auto">
                <div className="text-[10px] uppercase tracking-widest text-[#6b6b6b] px-3 py-1.5 border-b border-[#d4d0c8]">
                  Select Time Zone
                </div>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <button
                    key={`${tz.shorthand}-${tz.iana}`}
                    type="button"
                    onClick={() => {
                      onTimeZoneChange(tz);
                      setIsTzDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                      currentTimeZone.shorthand === tz.shorthand && currentTimeZone.iana === tz.iana
                        ? 'bg-[#1a1a1a] text-[#faf7f2]'
                        : 'text-[#1a1a1a] hover:bg-[#e8e4db]'
                    }`}
                  >
                    <span className="font-medium">{tz.shorthand} · {tz.name}</span>
                    <span className="font-mono-nums text-[11px] opacity-70">{tz.offset}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[#a3a3a3] font-light text-xs flex-shrink-0">|</span>

          {/* Date selector strictly on the SAME LINE as Time and Timezone */}
          <div className="relative inline-block flex-shrink-0" ref={calRef}>
            <button
              type="button"
              onClick={() => setIsCalendarDropdownOpen(!isCalendarDropdownOpen)}
              className="text-xs sm:text-sm font-normal text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 inline-flex items-center gap-1"
            >
              <span>{formattedDisplayDate}</span>
              <ChevronDown className="w-3 h-3 text-[#6b6b6b] stroke-[1.5]" />
            </button>

            {isCalendarDropdownOpen && (
              <div className="absolute left-0 mt-2 w-68 bg-[#f4f0e8] z-50 p-4 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#d4d0c8]">
                  <button
                    type="button"
                    onClick={handlePrevCalMonth}
                    className="p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium text-[#1a1a1a]">
                    {monthNames[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextCalMonth}
                    className="p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#6b6b6b] mb-1">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`cal-pad-${i}`} className="h-6" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleSelectGoalDate(day)}
                        className={`h-6 text-xs font-mono-nums flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#1a1a1a] text-[#faf7f2]'
                            : 'text-[#1a1a1a] hover:bg-[#e8e4db]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2 border-t border-[#d4d0c8] flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const todayIso = new Date().toISOString().split('T')[0];
                      onDateChange(todayIso);
                      setIsCalendarDropdownOpen(false);
                    }}
                    className="underline underline-offset-2 text-[#1a1a1a]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarDropdownOpen(false)}
                    className="text-[#6b6b6b] hover:text-[#1a1a1a]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line 2: Navigation Links */}
        <nav className="flex flex-wrap items-baseline gap-4 sm:gap-5 text-sm">
          <button
            type="button"
            onClick={() => onViewChange('timeline')}
            className={`transition-all text-sm tracking-wide ${
              currentView === 'timeline'
                ? 'text-[#1a1a1a] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 decoration-1'
            }`}
          >
            timeline
          </button>

          <button
            type="button"
            onClick={() => onViewChange('calendar')}
            className={`transition-all text-sm tracking-wide ${
              currentView === 'calendar'
                ? 'text-[#1a1a1a] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 decoration-1'
            }`}
          >
            calendar
          </button>

          <button
            type="button"
            onClick={() => onViewChange('completed_tasks')}
            className={`transition-all text-sm tracking-wide ${
              currentView === 'completed_tasks'
                ? 'text-[#1a1a1a] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 decoration-1'
            }`}
          >
            completed tasks {completedCount > 0 && <span className="font-mono-nums text-xs opacity-70">({completedCount})</span>}
          </button>

          <button
            type="button"
            onClick={() => onViewChange('update_tasks')}
            className={`transition-all text-sm tracking-wide ${
              currentView === 'update_tasks' || currentView === 'add_task' || currentView === 'edit_task'
                ? 'text-[#1a1a1a] font-semibold underline underline-offset-8 decoration-2'
                : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 decoration-1'
            }`}
          >
            update tasks {activeCount > 0 && <span className="font-mono-nums text-xs opacity-70">({activeCount})</span>}
          </button>

          {/* Account Icon with guaranteed non-overflowing dropdown */}
          <div className="relative inline-block" ref={accountRef}>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
              title="Account settings & alerts"
              aria-label="Account Settings and Alerts"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="text-sm">
                {currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : 'account'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#6b6b6b] stroke-[1.5]" />
            </button>

            {isAccountDropdownOpen && (
              <div
                className="fixed left-4 right-4 sm:left-auto sm:right-10 top-20 sm:w-80 bg-[#f4f0e8] z-50 p-4 border-b border-[#1a1a1a] text-[#1a1a1a] animate-in fade-in duration-100 max-w-[calc(100vw-32px)]"
              >
                {/* Section 1: Account Settings */}
                <div className="pb-3 border-b border-[#d4d0c8]">
                  <div className="text-[10px] uppercase tracking-widest text-[#6b6b6b] mb-2">
                    Account Settings
                  </div>

                  {currentUser ? (
                    <div>
                      <div className="text-xs font-medium text-[#1a1a1a] truncate mb-0.5">
                        {currentUser.email}
                      </div>
                      <div className="text-[11px] text-[#6b6b6b] mb-3">
                        Signed in · Cloud synchronization active
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          setIsAccountDropdownOpen(false);
                        }}
                        className="text-xs text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 inline-flex items-center gap-1.5 font-medium"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>log out</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-[#1a1a1a] mb-1 font-normal">
                        Guest Mode (Local Storage)
                      </div>
                      <div className="text-[11px] text-[#6b6b6b] mb-3 leading-relaxed">
                        Sign in to securely store tasks across sessions.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountDropdownOpen(false);
                          onOpenAuth();
                        }}
                        className="text-xs text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 inline-flex items-center gap-1.5 font-medium"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>log in / sign up</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 2: Alerts & Push Notifications */}
                <div className="pt-3">
                  <div className="text-[10px] uppercase tracking-widest text-[#6b6b6b] mb-2 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    <span>Task Alerts &amp; Notifications</span>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-xs cursor-pointer py-1">
                      <span>Enable Alerts</span>
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => onToggleNotifications(e.target.checked)}
                        className="accent-[#1a1a1a] w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <div>
                      <label className="block text-[11px] text-[#6b6b6b] mb-1">
                        Remind before task start:
                      </label>
                      <select
                        value={notificationLeadMinutes}
                        onChange={(e) => onUpdateLeadMinutes(parseInt(e.target.value, 10))}
                        disabled={!notificationsEnabled}
                        className="w-full bg-[#faf7f2] border-b border-[#1a1a1a] py-1 text-xs outline-none disabled:opacity-50"
                      >
                        <option value={5}>5 minutes before</option>
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                        <option value={60}>1 hour before</option>
                      </select>
                    </div>

                    <p className="text-[10px] text-[#8c8c8c] leading-relaxed">
                      Reminds you of the scheduled task name and start time before it begins.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
