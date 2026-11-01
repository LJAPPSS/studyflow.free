import type { AvailabilityBlock, Exam, Subject } from '@/types/study';
import { toDateInputValue } from '@/lib/format';

export type CalendarCell = { iso: string; day: number; inMonth: boolean; isToday: boolean };

export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function buildMonthGrid(month: Date, todayIso: string): CalendarCell[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - weekdayIndex(first));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toDateInputValue(date);
    return { iso, day: date.getDate(), inMonth: date.getMonth() === month.getMonth(), isToday: iso === todayIso };
  });
}

export function availabilityForDate(iso: string, blocks: AvailabilityBlock[]): AvailabilityBlock[] {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = weekdayIndex(date);
  return blocks
    .filter((block) => block.specific_date === iso || (block.specific_date === null && block.weekday === weekday))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

export function examsByDate(exams: Exam[]): Map<string, Exam[]> {
  const map = new Map<string, Exam[]>();
  for (const exam of exams) {
    const list = map.get(exam.exam_date) ?? [];
    list.push(exam);
    map.set(exam.exam_date, list);
  }
  for (const list of map.values()) list.sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  return map;
}

export function subjectById(subjects: Subject[]): Map<string, Subject> {
  return new Map(subjects.map((subject) => [subject.id, subject]));
}
