import type { SubjectColorKey } from '@/lib/constants';

export type Profile = {
  user_id: string;
  display_name: string;
  school_level: string | null;
  school_grade: number | null;
  onboarding_completed: boolean;
  tour_completed: boolean;
  weekly_goal_minutes: number | null;
};

export type SchoolYear = {
  id: string;
  label: string;
  created_at: string;
};

export type ExamPeriod = {
  id: string;
  school_year_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
};

export type Subject = {
  id: string;
  name: string;
  color: SubjectColorKey;
  difficulty: number;
  confidence: number;
};

export type Exam = {
  id: string;
  subject_id: string;
  exam_period_id: string | null;
  exam_date: string;
  start_time: string | null;
  duration_minutes: number | null;
  title: string | null;
};

export type AvailabilityBlock = {
  id: string;
  kind: 'studietijd' | 'verplichting';
  weekday: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  label: string | null;
};

export type Flashcard = {
  id: string;
  subject_id: string;
  front: string;
  back: string;
  created_at: string;
};

export type StudySession = {
  id: string;
  subject_id: string;
  exam_id: string | null;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  completed: boolean;
};

export type FocusSession = {
  id: string;
  subject_id: string | null;
  session_date: string;
  duration_minutes: number;
};

export type Grade = {
  id: string;
  subject_id: string;
  title: string | null;
  grade: number;
  weight: number;
  grade_date: string;
};

export type SubjectNote = {
  subject_id: string;
  body: string;
};

export type StudyGroup = {
  id: string;
  name: string;
  invite_code: string;
};

export type GroupMember = {
  user_id: string;
  name: string;
  minutes: number;
};

export type StudyData = {
  profile: Profile | null;
  schoolYears: SchoolYear[];
  examPeriods: ExamPeriod[];
  subjects: Subject[];
  exams: Exam[];
  availability: AvailabilityBlock[];
  sessions: StudySession[];
  focusSessions: FocusSession[];
  grades: Grade[];
  subjectNotes: SubjectNote[];
};
