import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TimeZoneOption } from '../types';
import { parseTimeToMinutes, formatDisplayTime, getDayOfWeekName } from './timezones';

interface NotificationState {
  enabled: boolean;
  leadMinutes: number; // minutes before start time
  permission: NotificationPermission;
  activeAlert: {
    id: string;
    taskName: string;
    scheduledTime: string;
    leadMinutes: number;
  } | null;
}

export function useNotifications(
  tasks: Task[],
  currentTimeZone: TimeZoneOption,
  selectedDate: string
) {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return (
      localStorage.getItem('cronble_notifs_enabled') === 'true' ||
      localStorage.getItem('chronos_notifs_enabled') === 'true'
    );
  });

  const [leadMinutes, setLeadMinutes] = useState<number>(() => {
    const val = localStorage.getItem('cronble_notifs_lead') || localStorage.getItem('chronos_notifs_lead');
    return val ? parseInt(val, 10) : 10;
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    taskName: string;
    scheduledTime: string;
    leadMinutes: number;
  } | null>(null);

  const notifiedTaskIds = useRef<Set<string>>(new Set());

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result === 'granted') {
          setEnabled(true);
          localStorage.setItem('cronble_notifs_enabled', 'true');
        }
        return result;
      } catch (err) {
        console.warn('Notification permission error', err);
      }
    }
    return 'denied';
  }, []);

  const toggleEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    localStorage.setItem('cronble_notifs_enabled', String(value));
    if (value && permission !== 'granted') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const updateLeadMinutes = useCallback((minutes: number) => {
    setLeadMinutes(minutes);
    localStorage.setItem('cronble_notifs_lead', String(minutes));
  }, []);

  // Web Audio subtle chime
  const playAlertChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.65);
    } catch {
      // Audio not permitted without interaction
    }
  }, []);

  // Check upcoming tasks on interval
  useEffect(() => {
    if (!enabled) return;

    const checkInterval = setInterval(() => {
      // Get current minutes of day in selected timezone
      const now = new Date();
      let nowMinutes = now.getHours() * 60 + now.getMinutes();
      try {
        const timeStr = new Intl.DateTimeFormat('en-GB', {
          timeZone: currentTimeZone.iana,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now);
        const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
        nowMinutes = h * 60 + m;
      } catch {
        // fallback
      }

      const todayIso = now.toISOString().split('T')[0];
      const dow = getDayOfWeekName(selectedDate);

      tasks.forEach((task) => {
        if (task.completed) return;

        // Verify task is scheduled for today or recurring today
        const matchesDate =
          (task.date && task.date === selectedDate) ||
          (task.recurrence && task.recurrence.includes(dow)) ||
          (!task.date && (!task.recurrence || task.recurrence.length === 0));

        if (!matchesDate) return;

        const startMin = parseTimeToMinutes(task.startTime);
        const diff = startMin - nowMinutes;

        // If time until task matches leadMinutes (within 1 minute window) and not yet notified today
        const notificationKey = `${task.id}-${todayIso}-${task.startTime}-${leadMinutes}`;

        if (diff >= 0 && diff <= leadMinutes && !notifiedTaskIds.current.has(notificationKey)) {
          notifiedTaskIds.current.add(notificationKey);

          const scheduledTimeStr = formatDisplayTime(task.startTime);

          // 1. Browser Native Push Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`Upcoming Task Reminder`, {
                body: `"${task.name}" is scheduled to begin in ${diff} minutes (${scheduledTimeStr}).`,
                icon: '/favicon.ico',
              });
            } catch (e) {
              console.warn('Native notification dispatch failed:', e);
            }
          }

          // 2. In-App Banner Notification Alert
          setActiveAlert({
            id: task.id,
            taskName: task.name,
            scheduledTime: scheduledTimeStr,
            leadMinutes: diff,
          });

          playAlertChime();
        }
      });
    }, 15000); // Check every 15s

    return () => clearInterval(checkInterval);
  }, [enabled, leadMinutes, tasks, currentTimeZone, selectedDate, playAlertChime]);

  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return {
    enabled,
    leadMinutes,
    permission,
    activeAlert,
    toggleEnabled,
    updateLeadMinutes,
    requestPermission,
    dismissAlert,
  };
}
