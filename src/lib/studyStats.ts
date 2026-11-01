import { parseDateOnly, toDateInputValue } from '@/lib/format';
import type { FocusSession, StudySession } from '@/types/study';

export type StudyRecord = {
  session_date: string;
  duration_minutes: number;
  subject_id: string | null;
};

export function studyRecords(sessions: StudySession[], focusSessions: FocusSession[]): StudyRecord[] {
  const finishedPlanned = sessions
    .filter((session) => session.completed)
    .map((session) => ({ session_date: session.session_date, duration_minutes: session.duration_minutes, subject_id: session.subject_id }));
  return [...finishedPlanned, ...focusSessions];
}

export function shiftDate(iso: string, days: number): string {
  const date = parseDateOnly(iso);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function weekStart(today: string): string {
  const offset = (parseDateOnly(today).getDay() + 6) % 7;
  return shiftDate(today, -offset);
}

export function minutesSince(records: StudyRecord[], fromDate: string): number {
  return records
    .filter((record) => record.session_date >= fromDate)
    .reduce((sum, record) => sum + record.duration_minutes, 0);
}

export function minutesByDate(records: StudyRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const record of records) {
    totals.set(record.session_date, (totals.get(record.session_date) ?? 0) + record.duration_minutes);
  }
  return totals;
}

export function currentStreak(records: StudyRecord[], today: string): number {
  const days = new Set(records.map((record) => record.session_date));
  let cursor = days.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export type BadgeInput = {
  records: StudyRecord[];
  focusCount: number;
  streak: number;
  weekMinutes: number;
  weeklyGoalMinutes: number | null;
  gradeCount: number;
};

export type Badge = { key: string; label: string; description: string; earned: boolean };

export function buildBadges(input: BadgeInput): Badge[] {
  const totalMinutes = input.records.reduce((sum, record) => sum + record.duration_minutes, 0);
  return [
    { key: 'eerste-sessie', label: 'Eerste stap', description: 'Rond je eerste studieblok af.', earned: input.records.length >= 1 },
    { key: 'week-reeks', label: 'Week vol', description: 'Studeer zeven dagen na elkaar.', earned: input.streak >= 7 },
    { key: 'tien-uur', label: 'Tien uur', description: 'Studeer in totaal tien uur.', earned: totalMinutes >= 600 },
    { key: 'focus-meester', label: 'Focusmeester', description: 'Rond tien focusblokken af.', earned: input.focusCount >= 10 },
    {
      key: 'doel-gehaald',
      label: 'Doel gehaald',
      description: 'Haal je wekelijkse studiedoel.',
      earned: input.weeklyGoalMinutes !== null && input.weekMinutes >= input.weeklyGoalMinutes,
    },
    { key: 'cijferverzamelaar', label: 'Cijferverzamelaar', description: 'Voeg vijf cijfers toe.', earned: input.gradeCount >= 5 },
  ];
}
