/*
# Create core school tables for EXAMIQ

## Plain-English summary
Creates the tables that hold each student's profile, school years, exam periods,
subjects, exams, study availability and the folder and file structure of their Drive.
Every table belongs to exactly one signed-in student and is locked down so that
students can only read and change their own rows.

## New tables
1. `profiles` - one row per student: display name, school level, year and onboarding state.
2. `school_years` - school years such as "2026-2027" belonging to a student.
3. `exam_periods` - exam windows inside a school year (e.g. Kerstexamens, Paasexamens, Juniexamens).
4. `subjects` - school subjects with colour key, difficulty (1-5) and confidence (1-5).
5. `exams` - individual exams linked to a subject, with date, start time and duration.
6. `availability_blocks` - weekly study windows, recurring commitments and one-off date exceptions.
7. `folders` - unlimited nested Drive folders, optionally linked to a subject.
8. `files` - metadata for every Drive file; the binary lives in private cloud storage.

## Security
- Row level security is enabled on every new table.
- Only the `authenticated` role receives access; the anonymous role receives nothing.
- Four separate policies (select, insert, update, delete) per table check `auth.uid() = user_id`.
- `user_id` defaults to the signed-in user so inserts never need to pass it explicitly.

## Important notes
1. No existing tables are modified or dropped.
2. Every statement is idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), so the migration can be safely re-run.
3. Check constraints enforce valid weekday numbers, 1-5 ratings, time ordering and positive durations.
*/

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 1 AND 80),
  school_level text,
  school_grade smallint CHECK (school_grade IS NULL OR school_grade BETWEEN 1 AND 6),
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(trim(label)) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, label)
);

CREATE TABLE IF NOT EXISTS exam_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  school_year_id uuid NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS exam_periods_user_idx ON exam_periods (user_id);
CREATE INDEX IF NOT EXISTS exam_periods_school_year_idx ON exam_periods (school_year_id);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  color text NOT NULL DEFAULT 'blue',
  difficulty smallint NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  confidence smallint NOT NULL DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subjects_user_name_idx ON subjects (user_id, lower(name));

CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_period_id uuid REFERENCES exam_periods(id) ON DELETE SET NULL,
  exam_date date NOT NULL,
  start_time time,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exams_user_idx ON exams (user_id);
CREATE INDEX IF NOT EXISTS exams_subject_idx ON exams (subject_id);
CREATE INDEX IF NOT EXISTS exams_period_idx ON exams (exam_period_id);

CREATE TABLE IF NOT EXISTS availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('studietijd', 'verplichting')),
  weekday smallint CHECK (weekday IS NULL OR weekday BETWEEN 0 AND 6),
  specific_date date,
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (weekday IS NOT NULL OR specific_date IS NOT NULL),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS availability_blocks_user_idx ON availability_blocks (user_id);

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS folders_user_idx ON folders (user_id);
CREATE INDEX IF NOT EXISTS folders_parent_idx ON folders (parent_id);
CREATE INDEX IF NOT EXISTS folders_subject_idx ON folders (subject_id);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 255),
  storage_path text NOT NULL UNIQUE,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  is_favorite boolean NOT NULL DEFAULT false,
  last_opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS files_user_idx ON files (user_id);
CREATE INDEX IF NOT EXISTS files_folder_idx ON files (folder_id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON school_years TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exam_periods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON exams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON availability_blocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON files TO authenticated;

DROP POLICY IF EXISTS "select_own_profiles" ON profiles;
CREATE POLICY "select_own_profiles" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profiles" ON profiles;
CREATE POLICY "insert_own_profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profiles" ON profiles;
CREATE POLICY "update_own_profiles" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profiles" ON profiles;
CREATE POLICY "delete_own_profiles" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_school_years" ON school_years;
CREATE POLICY "select_own_school_years" ON school_years FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_school_years" ON school_years;
CREATE POLICY "insert_own_school_years" ON school_years FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_school_years" ON school_years;
CREATE POLICY "update_own_school_years" ON school_years FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_school_years" ON school_years;
CREATE POLICY "delete_own_school_years" ON school_years FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_exam_periods" ON exam_periods;
CREATE POLICY "select_own_exam_periods" ON exam_periods FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_exam_periods" ON exam_periods;
CREATE POLICY "insert_own_exam_periods" ON exam_periods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_exam_periods" ON exam_periods;
CREATE POLICY "update_own_exam_periods" ON exam_periods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_exam_periods" ON exam_periods;
CREATE POLICY "delete_own_exam_periods" ON exam_periods FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_subjects" ON subjects;
CREATE POLICY "select_own_subjects" ON subjects FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subjects" ON subjects;
CREATE POLICY "insert_own_subjects" ON subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subjects" ON subjects;
CREATE POLICY "update_own_subjects" ON subjects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_subjects" ON subjects;
CREATE POLICY "delete_own_subjects" ON subjects FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_exams" ON exams;
CREATE POLICY "select_own_exams" ON exams FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_exams" ON exams;
CREATE POLICY "insert_own_exams" ON exams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_exams" ON exams;
CREATE POLICY "update_own_exams" ON exams FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_exams" ON exams;
CREATE POLICY "delete_own_exams" ON exams FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_availability_blocks" ON availability_blocks;
CREATE POLICY "select_own_availability_blocks" ON availability_blocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_availability_blocks" ON availability_blocks;
CREATE POLICY "insert_own_availability_blocks" ON availability_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_availability_blocks" ON availability_blocks;
CREATE POLICY "update_own_availability_blocks" ON availability_blocks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_availability_blocks" ON availability_blocks;
CREATE POLICY "delete_own_availability_blocks" ON availability_blocks FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_folders" ON folders;
CREATE POLICY "select_own_folders" ON folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_folders" ON folders;
CREATE POLICY "insert_own_folders" ON folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_folders" ON folders;
CREATE POLICY "update_own_folders" ON folders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_folders" ON folders;
CREATE POLICY "delete_own_folders" ON folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_files" ON files;
CREATE POLICY "select_own_files" ON files FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_files" ON files;
CREATE POLICY "insert_own_files" ON files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_files" ON files;
CREATE POLICY "update_own_files" ON files FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_files" ON files;
CREATE POLICY "delete_own_files" ON files FOR DELETE TO authenticated USING (auth.uid() = user_id);
