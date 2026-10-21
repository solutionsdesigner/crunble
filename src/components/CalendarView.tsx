import React, { useState, useMemo } from 'react';
import { Task, CalendarMode, DayOfWeek } from '../types';
import { formatDisplayTime, getDayOfWeekName, parseTimeToMinutes } from '../utils/timezones';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onEditTask: (task: Task) => void;
  onBackToTimeline: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  selectedDate,
  onSelectDate,
  onEditTask,
  onBackToTimeline,
}) => {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');

  // Month navigation state
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const p = selectedDate.split('-');
    return p.length === 3 ? parseInt(p[0], 10) : new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const p = selectedDate.split('-');
    return p.length === 3 ? parseInt(p[1], 10) - 1 : new Date().getMonth();
  });

  // Week navigation state (start of week date: Monday)
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Month grid calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrev = () => {
    if (calendarMode === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((y) => y - 1);
      } else {
        setCurrentMonth((m) => m - 1);
      }
    } else {
      // Prev week
      const prev = new Date(weekStartDate);
      prev.setDate(prev.getDate() - 7);
      setWeekStartDate(prev);
    }
  };

  const handleNext = () => {
    if (calendarMode === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((y) => y + 1);
      } else {
        setCurrentMonth((m) => m + 1);
      }
    } else {
      // Next week
      const next = new Date(weekStartDate);
      next.setDate(next.getDate() + 7);
      setWeekStartDate(next);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(new Date().setDate(diff));
    setWeekStartDate(startOfWeek);
    onSelectDate(today.toISOString().split('T')[0]);
  };

  // Helper to get tasks for any given ISO date "YYYY-MM-DD"
  const getTasksForDate = (dateStr: string) => {
    const dow = getDayOfWeekName(dateStr);
    return tasks.filter((t) => {
      if (t.date && t.date === dateStr) return true;
      if (t.recurrence && t.recurrence.includes(dow)) return true;
      if (!t.date && (!t.recurrence || t.recurrence.length === 0)) return true;
      return false;
    }).sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  };

  // Week days list
  const weekDays = useMemo(() => {
    const days: { date: Date; iso: string; dow: DayOfWeek }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ date: d, iso, dow: getDayOfWeekName(iso) });
    }
    return days;
  }, [weekStartDate]);

  return (
    <div className="w-full min-h-[calc(100vh-140px)] bg-[#faf7f2] py-10 px-6 sm:px-12 text-[#1a1a1a]">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Back link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onBackToTimeline}
            className="text-xs text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-4 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>back to timeline</span>
          </button>
        </div>

        {/* Top Controls: Mode switcher & Date Navigator */}
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-6 pb-6 border-b border-[#1a1a1a] mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a]">
              Calendar Overview
            </h1>
            <p className="text-xs text-[#6b6b6b] mt-1 tracking-wide">
              {calendarMode === 'month'
                ? `${monthNames[currentMonth]} ${currentYear}`
                : `Week of ${weekDays[0]?.date.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekDays[6]?.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Month / Week View Mode Toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCalendarMode('month')}
                className={`transition-colors uppercase tracking-wider ${
                  calendarMode === 'month'
                    ? 'text-[#1a1a1a] font-semibold underline underline-offset-4'
                    : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-2'
                }`}
              >
                monthly grid
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                className={`transition-colors uppercase tracking-wider ${
                  calendarMode === 'week'
                    ? 'text-[#1a1a1a] font-semibold underline underline-offset-4'
                    : 'text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-2'
                }`}
              >
                weekly schedule
              </button>
            </div>

            {/* Prev / Today / Next buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                aria-label="Previous Period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="underline underline-offset-4 text-[#1a1a1a] hover:opacity-75"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
                aria-label="Next Period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MONTH VIEW */}
        {calendarMode === 'month' && (
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-[#1a1a1a] text-center text-xs uppercase tracking-widest text-[#6b6b6b] pb-2 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Month Grid: Clean cells with bottom underlines, no box borders, no shadows */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[110px] p-2 border-b border-[#e8e4db] opacity-25" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isoDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = getTasksForDate(isoDate);
                const isSelected = isoDate === selectedDate;

                return (
                  <div
                    key={isoDate}
                    onClick={() => onSelectDate(isoDate)}
                    className={`min-h-[110px] p-2 border-b border-[#e8e4db] transition-colors cursor-pointer group hover:bg-[#f4efe5] flex flex-col ${
                      isSelected ? 'bg-[#f4efe5]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`font-mono-nums text-xs ${
                          isSelected
                            ? 'font-bold underline underline-offset-4 text-[#1a1a1a]'
                            : 'text-[#6b6b6b] group-hover:text-[#1a1a1a]'
                        }`}
                      >
                        {day}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] text-[#8c8c8c] font-mono-nums">
                          {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      )}
                    </div>

                    {/* Task snippets */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          className={`text-[11px] leading-tight truncate hover:underline hover:underline-offset-2 ${
                            task.completed ? 'line-through text-[#8c8c8c]' : 'text-[#1a1a1a]'
                          }`}
                          title={`${task.startTime} - ${task.name}`}
                        >
                          <span className="font-mono-nums opacity-75 mr-1">{task.startTime}</span>
                          <span>{task.name}</span>
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-[#6b6b6b] underline underline-offset-1">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW */}
        {calendarMode === 'week' && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day Columns Header */}
              <div className="grid grid-cols-7 border-b border-[#1a1a1a] pb-3 mb-4 text-center">
                {weekDays.map(({ date, iso, dow }) => {
                  const isSelected = iso === selectedDate;
                  const dayTasks = getTasksForDate(iso);
                  return (
                    <div
                      key={iso}
                      onClick={() => onSelectDate(iso)}
                      className="cursor-pointer group px-2"
                    >
                      <div className="text-xs uppercase tracking-wider text-[#6b6b6b]">
                        {dow.slice(0, 3)}
                      </div>
                      <div
                        className={`font-mono-nums text-lg mt-0.5 ${
                          isSelected
                            ? 'font-bold underline underline-offset-4 text-[#1a1a1a]'
                            : 'text-[#1a1a1a] group-hover:underline'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="text-[10px] text-[#8c8c8c] mt-0.5">
                        {dayTasks.length} tasks
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 7 Columns Week Grid */}
              <div className="grid grid-cols-7 gap-4 min-h-[450px]">
                {weekDays.map(({ iso, dow }) => {
                  const dayTasks = getTasksForDate(iso);
                  const isSelected = iso === selectedDate;
                  return (
                    <div
                      key={iso}
                      className={`flex flex-col border-b border-[#1a1a1a] pb-6 pt-2 transition-colors ${
                        isSelected ? 'bg-[#f4efe5]/60' : ''
                      }`}
                    >
                      <div className="space-y-3">
                        {dayTasks.length === 0 ? (
                          <div className="text-xs text-[#a3a3a3] italic pt-4 text-center font-light">
                            Free
                          </div>
                        ) : (
                          dayTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => onEditTask(task)}
                              className="p-2 cursor-pointer transition-colors hover:bg-[#e8e4db] border-b border-[#d4d0c8]"
                            >
                              <div className="font-mono-nums text-[11px] text-[#6b6b6b] mb-0.5">
                                {formatDisplayTime(task.startTime)} – {formatDisplayTime(task.endTime)}
                              </div>
                              <div
                                className={`text-xs font-normal leading-snug ${
                                  task.completed ? 'line-through text-[#8c8c8c]' : 'text-[#1a1a1a]'
                                }`}
                              >
                                {task.name}
                              </div>
                              <div className="text-[10px] text-[#6b6b6b] mt-1 capitalize">
                                {task.priority} priority
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
