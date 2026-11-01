import { availabilityForDate } from '@/lib/calendar';
import { parseDateOnly, toDateInputValue } from '@/lib/format';
import type { AvailabilityBlock, Exam, StudySession, Subject } from '@/types/study';

export const SESSION_MINUTES = 45;
const MINUTES_PER_WEIGHT_POINT = 20;
const START_ROUNDING_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_EXAM_MINUTES = 60;

export type PlannedSession = {
  subject_id: string;
  exam_id: string | null;
  session_date: string;
  start_time: string;
  duration_minutes: number;
};

export type PlanShortfall = { subject_id: string; missing_sessions: number };

export type StudyPlan = { sessions: PlannedSession[]; shortfalls: PlanShortfall[] };

type PlanInput = {
  today: string;
  nowMinutes: number;
  subjects: Subject[];
  exams: Exam[];
  availability: AvailabilityBlock[];
  sessions: StudySession[];
};

type Interval = { start: number; end: number };
type Slot = { date: string; start: number };

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTimeValue(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mins = String(minutes % 60).padStart(2, '0');
  return `${hours}:${mins}:00`;
}

function nextDay(iso: string): string {
  const date = parseDateOnly(iso);
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

export function requiredSessions(subject: Subject): number {
  const weight = subject.difficulty * (6 - subject.confidence);
  return Math.max(1, Math.ceil((weight * MINUTES_PER_WEIGHT_POINT) / SESSION_MINUTES));
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end);
    else merged.push({ ...interval });
  }
  return merged;
}

function subtractBusy(free: Interval[], busy: Interval[]): Interval[] {
  return busy.reduce((remaining, blocked) => {
    return remaining.flatMap((part) => {
      if (blocked.end <= part.start || blocked.start >= part.end) return [part];
      const pieces: Interval[] = [];
      if (blocked.start > part.start) pieces.push({ start: part.start, end: blocked.start });
      if (blocked.end < part.end) pieces.push({ start: blocked.end, end: part.end });
      return pieces;
    });
  }, free);
}

function addBusy(map: Map<string, Interval[]>, date: string, interval: Interval): void {
  const list = map.get(date) ?? [];
  list.push(interval);
  map.set(date, list);
}

export function buildStudyPlan(input: PlanInput): StudyPlan {
  const { today, subjects, exams, availability, sessions } = input;
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  const upcomingExams = exams
    .filter((exam) => exam.exam_date > today && subjectById.has(exam.subject_id))
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  const deadlines = new Map<string, Exam>();
  for (const exam of upcomingExams) {
    if (!deadlines.has(exam.subject_id)) deadlines.set(exam.subject_id, exam);
  }
  if (deadlines.size === 0) return { sessions: [], shortfalls: [] };

  const lastDeadline = [...deadlines.values()].reduce((latest, exam) => (exam.exam_date > latest ? exam.exam_date : latest), today);

  const busyByDate = new Map<string, Interval[]>();
  const doneBySubject = new Map<string, number>();

  for (const session of sessions) {
    if (!session.completed || session.session_date < today) continue;
    const start = toMinutes(session.start_time);
    addBusy(busyByDate, session.session_date, { start, end: start + session.duration_minutes });
    doneBySubject.set(session.subject_id, (doneBySubject.get(session.subject_id) ?? 0) + 1);
  }

  for (const exam of upcomingExams) {
    if (exam.start_time) {
      const start = toMinutes(exam.start_time);
      addBusy(busyByDate, exam.exam_date, { start, end: start + (exam.duration_minutes ?? DEFAULT_EXAM_MINUTES) });
    } else {
      addBusy(busyByDate, exam.exam_date, { start: 0, end: MINUTES_PER_DAY });
    }
  }

  const roundedNow = Math.ceil(input.nowMinutes / START_ROUNDING_MINUTES) * START_ROUNDING_MINUTES;
  const slots: Slot[] = [];

  for (let date = today; date < lastDeadline; date = nextDay(date)) {
    const studyBlocks = availabilityForDate(date, availability)
      .filter((block) => block.kind === 'studietijd')
      .map((block) => ({ start: toMinutes(block.start_time), end: toMinutes(block.end_time) }));
    const dayBusy = [
      ...(busyByDate.get(date) ?? []),
      ...availabilityForDate(date, availability)
        .filter((block) => block.kind === 'verplichting')
        .map((block) => ({ start: toMinutes(block.start_time), end: toMinutes(block.end_time) })),
    ];
    const freeToday = date === today ? [{ start: roundedNow, end: MINUTES_PER_DAY }] : [{ start: 0, end: MINUTES_PER_DAY }];
    const studyWindows = mergeIntervals(studyBlocks).flatMap((window) =>
      subtractBusy(
        [{ start: Math.max(window.start, freeToday[0].start), end: window.end }].filter((part) => part.end > part.start),
        dayBusy,
      ),
    );

    for (const window of studyWindows) {
      for (let start = window.start; start + SESSION_MINUTES <= window.end; start += SESSION_MINUTES) {
        slots.push({ date, start });
      }
    }
  }

  const used = new Set<number>();
  const planned: PlannedSession[] = [];
  const shortfalls: PlanShortfall[] = [];

  const order = [...deadlines.entries()].sort(([aId, a], [bId, b]) => {
    if (a.exam_date !== b.exam_date) return a.exam_date.localeCompare(b.exam_date);
    return (subjectById.get(bId)?.difficulty ?? 0) - (subjectById.get(aId)?.difficulty ?? 0);
  });

  for (const [subjectId, exam] of order) {
    const subject = subjectById.get(subjectId);
    if (!subject) continue;
    const need = Math.max(0, requiredSessions(subject) - (doneBySubject.get(subjectId) ?? 0));
    if (need === 0) continue;

    const candidates: number[] = [];
    slots.forEach((slot, index) => {
      if (!used.has(index) && slot.date < exam.exam_date) candidates.push(index);
    });

    const take = Math.min(need, candidates.length);
    for (let i = 0; i < take; i += 1) {
      const index = candidates[Math.floor((i * candidates.length) / take)];
      used.add(index);
      const slot = slots[index];
      planned.push({
        subject_id: subjectId,
        exam_id: exam.id,
        session_date: slot.date,
        start_time: toTimeValue(slot.start),
        duration_minutes: SESSION_MINUTES,
      });
    }

    if (need > take) shortfalls.push({ subject_id: subjectId, missing_sessions: need - take });
  }

  planned.sort((a, b) => (a.session_date === b.session_date ? a.start_time.localeCompare(b.start_time) : a.session_date.localeCompare(b.session_date)));

  return { sessions: planned, shortfalls };
}
