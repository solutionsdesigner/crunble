import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface DateTimePickerDropdownProps {
  id?: string;
  label: string;
  value: string; // "HH:MM" or "YYYY-MM-DD HH:MM"
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const DateTimePickerDropdown: React.FC<DateTimePickerDropdownProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'e.g. 09:00',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const [hours, setHours] = useState<string>('09');
  const [minutes, setMinutes] = useState<string>('00');

  useEffect(() => {
    if (!value) return;

    const dateMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      setSelectedYear(parseInt(dateMatch[1], 10));
      setSelectedMonth(parseInt(dateMatch[2], 10) - 1);
      setSelectedDay(parseInt(dateMatch[3], 10));
    }

    const timeMatch = value.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      setHours(timeMatch[1].padStart(2, '0'));
      setMinutes(timeMatch[2].padStart(2, '0'));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeStr = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    if (value.includes('-')) {
      onChange(`${dateStr} ${timeStr}`);
    } else {
      onChange(timeStr);
    }
  };

  const handleTimeChange = (newH: string, newM: string) => {
    setHours(newH);
    setMinutes(newM);
    const timeStr = `${newH.padStart(2, '0')}:${newM.padStart(2, '0')}`;
    if (value.includes('-')) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      onChange(`${dateStr} ${timeStr}`);
    } else {
      onChange(timeStr);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const quickTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="relative w-full" ref={containerRef}>
      <label htmlFor={id} className="block text-xs font-normal tracking-wide text-[#6b6b6b] mb-1">
        {label}
      </label>

      {/* Input indicated strictly by bottom underline, no outer border, no shadow */}
      <div className="relative flex items-center border-b border-[#1a1a1a] focus-within:border-[#1a1a1a]">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full py-2 bg-transparent text-[#1a1a1a] placeholder:text-[#a3a3a3] text-sm font-mono-nums outline-none border-0 focus:ring-0 pr-8"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={`Toggle calendar and time picker for ${label}`}
          className="absolute right-0 py-2 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 mt-3 w-76 bg-[#f4f0e8] p-4 text-[#1a1a1a] border-b border-[#1a1a1a]">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#d4d0c8] mb-3">
            <span className="text-xs uppercase tracking-widest text-[#6b6b6b] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Time &amp; Date
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs underline underline-offset-4 text-[#1a1a1a] hover:opacity-75 transition-opacity"
            >
              Done
            </button>
          </div>

          {/* Time Picker Above */}
          <div className="mb-4 pb-3 border-b border-[#d4d0c8]">
            <div className="text-xs text-[#6b6b6b] mb-2 flex items-center justify-between">
              <span>Time Picker</span>
              <span className="font-mono-nums text-[#1a1a1a] font-medium">{hours}:{minutes}</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <label className="text-[10px] text-[#6b6b6b] block mb-1">Hour (24h)</label>
                <select
                  value={hours}
                  onChange={(e) => handleTimeChange(e.target.value, minutes)}
                  className="w-full bg-[#faf7f2] border-b border-[#1a1a1a] py-1 text-xs font-mono-nums outline-none text-[#1a1a1a]"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const h = String(i).padStart(2, '0');
                    return (
                      <option key={h} value={h}>
                        {h}:00 ({i % 12 || 12} {i >= 12 ? 'PM' : 'AM'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-[10px] text-[#6b6b6b] block mb-1">Minute</label>
                <select
                  value={minutes}
                  onChange={(e) => handleTimeChange(hours, e.target.value)}
                  className="w-full bg-[#faf7f2] border-b border-[#1a1a1a] py-1 text-xs font-mono-nums outline-none text-[#1a1a1a]"
                >
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                    <option key={m} value={m}>
                      :{m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickTimes.slice(0, 6).map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => {
                    const [qh, qm] = qt.split(':');
                    handleTimeChange(qh, qm);
                  }}
                  className={`text-[11px] px-1.5 py-0.5 font-mono-nums transition-colors ${
                    hours === qt.split(':')[0] && minutes === qt.split(':')[1]
                      ? 'bg-[#1a1a1a] text-[#faf7f2]'
                      : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-2'
                  }`}
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Date Picker Below */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-[#1a1a1a]">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                aria-label="Next Month"
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
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-6" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
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
          </div>

          <div className="mt-3 pt-2 border-t border-[#d4d0c8] text-[11px] text-[#6b6b6b] flex items-center justify-between">
            <span>Manual typing supported</span>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const nowH = String(now.getHours()).padStart(2, '0');
                const nowM = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
                handleTimeChange(nowH, nowM);
              }}
              className="underline underline-offset-2 text-[#1a1a1a]"
            >
              Current Time
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
