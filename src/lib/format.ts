const longDate = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
const weekdayDate = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const weekdayShort = new Intl.DateTimeFormat('nl-NL', { weekday: 'short' });
const dateTime = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toDateInputValue(new Date());
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value: string): string {
  return longDate.format(parseDateOnly(value));
}

export function formatShortDate(value: string): string {
  return shortDate.format(parseDateOnly(value));
}

export function formatWeekdayDate(value: string): string {
  return weekdayDate.format(parseDateOnly(value));
}

export function formatDecimal(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${formatDecimal(minutes / 60)} u`;
}

export function formatWeekdayShort(value: string): string {
  return weekdayShort.format(parseDateOnly(value));
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : '';
}

export function daysUntil(value: string): number {
  const today = parseDateOnly(todayIso());
  return Math.round((parseDateOnly(value).getTime() - today.getTime()) / MS_PER_DAY);
}

export function formatRelativeDays(days: number): string {
  if (days === 0) return 'Vandaag';
  if (days === 1) return 'Morgen';
  if (days === -1) return 'Gisteren';
  if (days > 0) return `Over ${days} dagen`;
  return `${Math.abs(days)} dagen geleden`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString('nl-NL', { maximumFractionDigits: 1 })} ${units[unit]}`;
}
