import { TimeZoneOption, DayOfWeek } from '../types';

export const TIMEZONE_OPTIONS: TimeZoneOption[] = [
  { shorthand: 'PDT', name: 'Pacific Daylight Time', iana: 'America/Los_Angeles', offset: 'UTC-7' },
  { shorthand: 'PST', name: 'Pacific Standard Time', iana: 'America/Los_Angeles', offset: 'UTC-8' },
  { shorthand: 'MDT', name: 'Mountain Daylight Time', iana: 'America/Denver', offset: 'UTC-6' },
  { shorthand: 'MST', name: 'Mountain Standard Time', iana: 'America/Phoenix', offset: 'UTC-7' },
  { shorthand: 'CDT', name: 'Central Daylight Time', iana: 'America/Chicago', offset: 'UTC-5' },
  { shorthand: 'CST', name: 'Central Standard Time', iana: 'America/Chicago', offset: 'UTC-6' },
  { shorthand: 'EDT', name: 'Eastern Daylight Time', iana: 'America/New_York', offset: 'UTC-4' },
  { shorthand: 'EST', name: 'Eastern Standard Time', iana: 'America/New_York', offset: 'UTC-5' },
  { shorthand: 'UTC', name: 'Coordinated Universal Time', iana: 'UTC', offset: 'UTC+0' },
  { shorthand: 'GMT', name: 'Greenwich Mean Time', iana: 'Europe/London', offset: 'UTC+0' },
  { shorthand: 'BST', name: 'British Summer Time', iana: 'Europe/London', offset: 'UTC+1' },
  { shorthand: 'CET', name: 'Central European Time', iana: 'Europe/Paris', offset: 'UTC+1' },
  { shorthand: 'CEST', name: 'Central European Summer Time', iana: 'Europe/Paris', offset: 'UTC+2' },
  { shorthand: 'IST', name: 'India Standard Time', iana: 'Asia/Kolkata', offset: 'UTC+5:30' },
  { shorthand: 'SGT', name: 'Singapore Time', iana: 'Asia/Singapore', offset: 'UTC+8' },
  { shorthand: 'JST', name: 'Japan Standard Time', iana: 'Asia/Tokyo', offset: 'UTC+9' },
  { shorthand: 'AEST', name: 'Australian Eastern Standard Time', iana: 'Australia/Sydney', offset: 'UTC+10' },
  { shorthand: 'AEDT', name: 'Australian Eastern Daylight Time', iana: 'Australia/Sydney', offset: 'UTC+11' },
  { shorthand: 'NZDT', name: 'New Zealand Daylight Time', iana: 'Pacific/Auckland', offset: 'UTC+13' },
  { shorthand: 'HST', name: 'Hawaii Standard Time', iana: 'Pacific/Honolulu', offset: 'UTC-10' },
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const DAY_SHORT_MAP: Record<string, DayOfWeek> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export function getDefaultTimeZone(): TimeZoneOption {
  try {
    const userIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = TIMEZONE_OPTIONS.find((tz) => tz.iana === userIana);
    if (match) return match;
    // Try to approximate
    return TIMEZONE_OPTIONS[0]; // PDT/America/Los_Angeles
  } catch {
    return TIMEZONE_OPTIONS[0];
  }
}

export function formatTimeInZone(date: Date, timeZoneIana: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneIana,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }
}

export function formatDateInZone(date: Date, timeZoneIana: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneIana,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function getISODateInZone(date: Date, timeZoneIana: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZoneIana,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // YYYY-MM-DD
  } catch {
    return date.toISOString().split('T')[0];
  }
}

export function getDayOfWeekName(dateStr: string): DayOfWeek {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday...
    const map: Record<number, DayOfWeek> = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
    };
    return map[dayIndex] || 'Monday';
  }
  return 'Monday';
}

/**
 * Normalizes time format to "HH:MM" (24h) or "HH:MM AM/PM"
 */
export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  // If timeStr is already like "09:00"
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  }
  // If full ISO or other format
  try {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  } catch {
    // fallback
  }
  return timeStr;
}

/**
 * Returns minute of day (0 - 1439) for time string e.g. "09:30"
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Check if "HH:MM"
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  // Try Date parse
  const d = new Date(timeStr);
  if (!isNaN(d.getTime())) {
    return d.getHours() * 60 + d.getMinutes();
  }
  return 0;
}
