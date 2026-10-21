export type Priority = 'low' | 'medium' | 'high';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Task {
  id: string;
  name: string;
  description: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:30"
  date?: string;      // YYYY-MM-DD
  priority: Priority;
  completed: boolean;
  recurrence: DayOfWeek[]; // Days of the week task repeats on
  doNotAutomaticallySchedule?: boolean; // If true, AI will not reschedule this task
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  timeZoneShorthand: string;
  notificationLeadMinutes: number; // e.g. 5, 10, 15, 30
  notificationsEnabled: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  token?: string;
  preferences?: UserPreferences;
}

export interface TimeZoneOption {
  shorthand: string;
  name: string;
  iana: string;
  offset: string;
}

export type ViewMode = 'timeline' | 'calendar' | 'update_tasks' | 'completed_tasks' | 'add_task' | 'edit_task' | 'auth';

export type CalendarMode = 'month' | 'week';
