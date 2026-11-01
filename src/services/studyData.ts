import { supabase } from '@/lib/supabase';
import type {
  AvailabilityBlock,
  Exam,
  FocusSession,
  Grade,
  Profile,
  SchoolYear,
  ExamPeriod,
  StudyData,
  StudySession,
  Subject,
  SubjectNote,
} from '@/types/study';

function unwrap<T>(result: { data: unknown; error: { message: string } | null }): T {
  if (result.error) throw result.error;
  return result.data as T;
}

export async function loadStudyData(): Promise<StudyData> {
  const [profile, schoolYears, examPeriods, subjects, exams, availability, sessions, focusSessions, grades, subjectNotes] =
    await Promise.all([
      supabase.from('profiles').select('*').maybeSingle(),
      supabase.from('school_years').select('*').order('created_at', { ascending: false }),
      supabase.from('exam_periods').select('*').order('created_at', { ascending: true }),
      supabase.from('subjects').select('*').order('name', { ascending: true }),
      supabase.from('exams').select('*').order('exam_date', { ascending: true }),
      supabase.from('availability_blocks').select('*').order('start_time', { ascending: true }),
      supabase.from('study_sessions').select('*').order('session_date', { ascending: true }).order('start_time', { ascending: true }),
      supabase.from('focus_sessions').select('*').order('session_date', { ascending: true }),
      supabase.from('grades').select('*').order('grade_date', { ascending: false }),
      supabase.from('subject_notes').select('subject_id, body'),
    ]);

  return {
    profile: unwrap<Profile | null>(profile),
    schoolYears: unwrap<SchoolYear[]>(schoolYears),
    examPeriods: unwrap<ExamPeriod[]>(examPeriods),
    subjects: unwrap<Subject[]>(subjects),
    exams: unwrap<Exam[]>(exams),
    availability: unwrap<AvailabilityBlock[]>(availability),
    sessions: unwrap<StudySession[]>(sessions),
    focusSessions: unwrap<FocusSession[]>(focusSessions),
    grades: unwrap<Grade[]>(grades),
    subjectNotes: unwrap<SubjectNote[]>(subjectNotes),
  };
}
