/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Task, ViewMode, TimeZoneOption, User } from './types';
import { loadTasks, saveTasks } from './utils/storage';
import { getDefaultTimeZone, getISODateInZone, DAY_SHORT_MAP } from './utils/timezones';
import { useNotifications } from './utils/useNotifications';
import { Header } from './components/Header';
import { TimelineView } from './components/TimelineView';
import { TaskTableView } from './components/TaskTableView';
import { TaskFormView } from './components/TaskFormView';
import { CalendarView } from './components/CalendarView';
import { AuthModal } from './components/AuthModal';
import { RescheduleModal } from './components/RescheduleModal';
import { PasswordWall } from './components/PasswordWall';
import { SubscriptionAndLegalModal } from './components/SubscriptionAndLegalModal';
import { Bell, RotateCcw, Lock, ShieldCheck } from 'lucide-react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('cronble_app_unlocked') === 'true' ||
        localStorage.getItem('chronos_app_unlocked') === 'true'
      );
    } catch {
      return false;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [previousTasksForUndo, setPreviousTasksForUndo] = useState<Task[] | null>(null);
  const [currentTimeZone, setCurrentTimeZone] = useState<TimeZoneOption>(() => getDefaultTimeZone());
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getISODateInZone(new Date(), getDefaultTimeZone().iana)
  );
  const [currentView, setCurrentView] = useState<ViewMode>('timeline');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [reschedulingTask, setReschedulingTask] = useState<Task | null>(null);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

  // User Authentication
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('cronble_auth_user') || localStorage.getItem('chronos_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'subscriptions' | 'terms' | 'privacy' | 'review_notes'>('subscriptions');

  // Push notifications hook for upcoming task alerts
  const {
    enabled: notificationsEnabled,
    leadMinutes: notificationLeadMinutes,
    activeAlert,
    toggleEnabled: toggleNotifications,
    updateLeadMinutes,
    dismissAlert,
  } = useNotifications(tasks, currentTimeZone, selectedDate);

  // Sync tasks to local storage & server if authenticated
  useEffect(() => {
    saveTasks(tasks);

    if (currentUser?.token) {
      fetch('/api/user/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ tasks }),
      }).catch((e) => console.warn('Failed to sync tasks with server:', e));
    }
  }, [tasks, currentUser]);

  // Check auth session on load
  useEffect(() => {
    if (currentUser?.token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentUser.token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session expired');
          return res.json();
        })
        .then((data) => {
          if (data.user) {
            setCurrentUser((prev) => ({ ...prev, ...data.user }));
            if (Array.isArray(data.tasks) && data.tasks.length > 0) {
              setTasks(data.tasks);
            }
          }
        })
        .catch(() => {
          // Token invalid or expired
          setCurrentUser(null);
          localStorage.removeItem('cronble_auth_user');
          localStorage.removeItem('chronos_auth_user');
        });
    }
  }, []);

  const handleTimeZoneChange = (newTz: TimeZoneOption) => {
    setCurrentTimeZone(newTz);
  };

  const handleToggleComplete = (task: Task) => {
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setCurrentView('edit_task');
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setCurrentView('add_task');
  };

  const handleDeleteTask = (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setScheduleNotice(`Task "${task.name}" deleted from itinerary.`);
  };

  const handleOpenReschedule = (task: Task) => {
    setReschedulingTask(task);
  };

  const handleConfirmReschedule = (_originalTask: Task, updatedTask: Task, rationale: string) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setScheduleNotice(`"${updatedTask.name}" rescheduled: ${rationale}`);
  };

  const handleSaveTask = (savedTask: Task) => {
    const exists = tasks.some((t) => t.id === savedTask.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? savedTask : t)));
    } else {
      setTasks([savedTask, ...tasks]);
    }
    setCurrentView('update_tasks');
    setEditingTask(null);
  };

  // AI Automatic Schedule
  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    setScheduleNotice(null);

    // Save previous snapshot for the undo button
    setPreviousTasksForUndo([...tasks]);

    const activeTasks = tasks.filter((t) => !t.completed);

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: activeTasks,
          date: selectedDate,
          timezone: currentTimeZone.shorthand,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.schedule)) {
        const scheduleMap = new Map<string, { startTime: string; endTime: string; recurrence?: string[] }>();
        data.schedule.forEach((s: { id: string; startTime: string; endTime: string; recurrence?: string[] }) => {
          scheduleMap.set(s.id, {
            startTime: s.startTime,
            endTime: s.endTime,
            recurrence: s.recurrence,
          });
        });

        const updatedTasks = tasks.map((t) => {
          // If task has "Do not automatically schedule", keep original time
          if (t.doNotAutomaticallySchedule) {
            return t;
          }

          const scheduled = scheduleMap.get(t.id);
          if (scheduled) {
            const recurrenceDays = Array.isArray(scheduled.recurrence)
              ? scheduled.recurrence.map((r) => DAY_SHORT_MAP[r] || r)
              : t.recurrence;

            return {
              ...t,
              startTime: scheduled.startTime,
              endTime: scheduled.endTime,
              recurrence: (recurrenceDays as any) || t.recurrence,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        });

        setTasks(updatedTasks);
        setScheduleNotice(
          'Itinerary automatically organized and optimized into daily timetable. Tasks marked "Do not automatically schedule" were preserved.'
        );
      } else {
        throw new Error('Invalid schedule data received');
      }
    } catch (err) {
      console.error('Failed to automatically schedule tasks:', err);
      // Fallback local scheduling honoring locked tasks
      let hour = 9;
      let min = 0;
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const flexibleActive = activeTasks.filter((t) => !t.doNotAutomaticallySchedule);
      const sortedActive = [...flexibleActive].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      const updatedMap = new Map<string, { startTime: string; endTime: string }>();
      sortedActive.forEach((t) => {
        const startStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        const duration = t.priority === 'high' ? 60 : t.priority === 'medium' ? 45 : 30;
        min += duration;
        while (min >= 60) {
          min -= 60;
          hour += 1;
        }
        const endStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        min += 15;
        while (min >= 60) {
          min -= 60;
          hour += 1;
        }
        updatedMap.set(t.id, { startTime: startStr, endTime: endStr });
      });

      const fallbackTasks = tasks.map((t) => {
        if (t.doNotAutomaticallySchedule) return t;
        const update = updatedMap.get(t.id);
        if (update) {
          return { ...t, startTime: update.startTime, endTime: update.endTime };
        }
        return t;
      });

      setTasks(fallbackTasks);
      setScheduleNotice(
        'Tasks scheduled using priority ordering while preserving locked task times.'
      );
    } finally {
      setIsScheduling(false);
    }
  };

  // Undo button handler
  const handleUndoSchedule = () => {
    if (previousTasksForUndo) {
      setTasks(previousTasksForUndo);
      setPreviousTasksForUndo(null);
      setScheduleNotice('Timetable reverted to state before automatic scheduling.');
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('cronble_auth_user', JSON.stringify(user));
    setScheduleNotice(`Signed in as ${user.email}. Tasks are synced securely.`);
  };

  const handleLogout = async () => {
    if (currentUser?.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
      } catch {
        // ignore
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('cronble_auth_user');
    localStorage.removeItem('chronos_auth_user');
    setScheduleNotice('Signed out. You are now working in guest mode.');
  };

  const handleLockApp = () => {
    try {
      localStorage.removeItem('cronble_app_unlocked');
      localStorage.removeItem('chronos_app_unlocked');
    } catch (e) {
      console.warn(e);
    }
    setIsUnlocked(false);
  };

  // Place app securely behind password protected wall until unlocked with "20260730"
  if (!isUnlocked) {
    return <PasswordWall onUnlock={() => setIsUnlocked(true)} />;
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.filter((t) => !t.completed).length;

  const isTimelineView = currentView === 'timeline';

  return (
    <div
      className={`bg-[#faf7f2] text-[#1a1a1a] flex flex-col font-sans selection:bg-[#1a1a1a] selection:text-[#faf7f2] ${
        isTimelineView ? 'h-screen max-h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Top Header */}
      <Header
        currentTimeZone={currentTimeZone}
        onTimeZoneChange={handleTimeZoneChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        currentView={currentView}
        onViewChange={(view) => {
          setScheduleNotice(null);
          setCurrentView(view);
        }}
        completedCount={completedCount}
        activeCount={activeCount}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        notificationsEnabled={notificationsEnabled}
        notificationLeadMinutes={notificationLeadMinutes}
        onToggleNotifications={toggleNotifications}
        onUpdateLeadMinutes={updateLeadMinutes}
      />

      {/* Push Notification Alert Toast / Banner */}
      {activeAlert && (
        <div className="bg-[#1a1a1a] text-[#faf7f2] px-6 sm:px-12 py-3 flex items-center justify-between text-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <Bell className="w-4 h-4 text-[#d4d0c8]" />
            <div>
              <span className="font-semibold uppercase tracking-wider mr-2">Upcoming Task Reminder:</span>
              <span>
                "{activeAlert.taskName}" begins in {activeAlert.leadMinutes} minutes ({activeAlert.scheduledTime})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissAlert}
            className="text-xs uppercase tracking-wider underline underline-offset-4 text-[#faf7f2] hover:opacity-75 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Global Notice Banner */}
      {scheduleNotice && (
        <div className="bg-[#f0ebe1] px-6 sm:px-12 py-3 border-b border-[#1a1a1a] flex items-center justify-between text-xs text-[#1a1a1a]">
          <span className="font-light">{scheduleNotice}</span>
          <button
            type="button"
            onClick={() => setScheduleNotice(null)}
            className="text-xs uppercase tracking-wider underline underline-offset-2 ml-4 hover:opacity-75"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Main Content View Switcher */}
      <main className={isTimelineView ? 'flex-1 flex flex-col overflow-hidden' : 'flex-1'}>
        {currentView === 'timeline' && (
          <TimelineView
            tasks={tasks}
            selectedDate={selectedDate}
            currentTimeZone={currentTimeZone}
            onEditTask={handleEditTask}
            onRescheduleTask={handleOpenReschedule}
            onToggleComplete={handleToggleComplete}
            onGoToUpdateTasks={() => setCurrentView('update_tasks')}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={(newDate) => {
              setSelectedDate(newDate);
              setCurrentView('timeline');
            }}
            onEditTask={handleEditTask}
            onBackToTimeline={() => setCurrentView('timeline')}
          />
        )}

        {currentView === 'update_tasks' && (
          <TaskTableView
            isCompletedView={false}
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onReschedule={handleOpenReschedule}
            onDelete={handleDeleteTask}
            onAddTask={handleAddTask}
            onAutoSchedule={handleAutoSchedule}
            onUndoSchedule={handleUndoSchedule}
            canUndo={Boolean(previousTasksForUndo && previousTasksForUndo.length > 0)}
            isScheduling={isScheduling}
            onBackToTimeline={() => setCurrentView('timeline')}
          />
        )}

        {currentView === 'completed_tasks' && (
          <TaskTableView
            isCompletedView={true}
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEdit={handleEditTask}
            onReschedule={handleOpenReschedule}
            onDelete={handleDeleteTask}
            onAddTask={handleAddTask}
            onAutoSchedule={handleAutoSchedule}
            onUndoSchedule={handleUndoSchedule}
            canUndo={false}
            isScheduling={isScheduling}
            onBackToTimeline={() => setCurrentView('timeline')}
          />
        )}

        {(currentView === 'add_task' || currentView === 'edit_task') && (
          <TaskFormView
            initialTask={currentView === 'edit_task' ? editingTask : null}
            onSave={handleSaveTask}
            onCancel={() => {
              setEditingTask(null);
              setCurrentView('update_tasks');
            }}
          />
        )}
      </main>

      {/* Minimalist Editorial Footer: Pinned at bottom without overflow on timeline */}
      <footer
        className={`w-full border-t border-[#d4d0c8] text-[#6b6b6b] text-xs flex-shrink-0 ${
          isTimelineView ? 'py-3.5 px-6 sm:px-12 bg-[#faf7f2]' : 'py-8 px-6 sm:px-12 bg-[#faf7f2]'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-baseline justify-between gap-3">
          <p className="tracking-wide text-[11px] sm:text-xs">
            Cronble · Daily Itinerary &amp; Timeline Progression
          </p>
          <div className="flex flex-wrap items-center gap-6 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setCurrentView('timeline')}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors"
            >
              timeline
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('calendar')}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors"
            >
              calendar
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('update_tasks')}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors"
            >
              update tasks
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('completed_tasks')}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors"
            >
              completed tasks
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('subscriptions');
                setIsLegalModalOpen(true);
              }}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors font-medium text-[#1a1a1a]"
            >
              subscriptions (3.1.2c)
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('terms');
                setIsLegalModalOpen(true);
              }}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors"
            >
              terms (EULA)
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('privacy');
                setIsLegalModalOpen(true);
              }}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors"
            >
              privacy
            </button>
            <button
              type="button"
              onClick={() => {
                setLegalModalTab('review_notes');
                setIsLegalModalOpen(true);
              }}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors text-[#8c8c8c]"
            >
              review notes
            </button>
            <button
              type="button"
              onClick={handleLockApp}
              className="underline underline-offset-4 hover:text-[#1a1a1a] transition-colors inline-flex items-center gap-1 text-[#6b6b6b]"
              title="Lock app behind password wall"
            >
              <Lock className="w-3 h-3 text-[#1a1a1a]" />
              <span>lock app</span>
            </button>
            {previousTasksForUndo && (
              <button
                type="button"
                onClick={handleUndoSchedule}
                className="underline underline-offset-4 text-[#1a1a1a] inline-flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>undo schedule</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* AI Task Reschedule Modal */}
      <RescheduleModal
        task={reschedulingTask}
        isOpen={reschedulingTask !== null}
        onClose={() => setReschedulingTask(null)}
        onConfirmReschedule={handleConfirmReschedule}
        currentDate={selectedDate}
        currentTimeZone={currentTimeZone}
      />

      {/* App Store Subscriptions, EULA & Privacy Modal */}
      <SubscriptionAndLegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultTab={legalModalTab}
      />
    </div>
  );
}
