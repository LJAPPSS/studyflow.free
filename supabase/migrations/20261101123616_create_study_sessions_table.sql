/*
# Create study sessions table for the study planner

## Plain-English summary
Stores the individual study sessions that the study planner schedules for each student, one row per planned block of time for a subject.

## New tables
1. `study_sessions`
   - `id` (uuid, primary key)
   - `user_id` (uuid, owner, defaults to the signed-in student)
   - `subject_id` (uuid, the subject being studied; removed together with the subject)
   - `exam_id` (uuid, the exam this session prepares for; cleared if the exam is removed)
   - `session_date` (date, the day of the session)
   - `start_time` (time, when the session starts)
   - `duration_minutes` (integer, length of the session, must be positive)
   - `completed` (boolean, whether the student marked the session as done)
   - `created_at` and `updated_at` (timestamps)

## Security
- Row level security is enabled on `study_sessions`.
- Only the `authenticated` role receives access, and only to its own rows.
- Four separate policies (select, insert, update, delete) check `auth.uid() = user_id`.
- Privileges granted: SELECT, INSERT, UPDATE, DELETE to `authenticated` only.

## Important notes
1. No existing tables are modified or dropped.
2. Every statement is idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), so the migration can be safely re-run.
3. Indexes are added for the owner, the date and the subject and exam references.
*/

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES exams(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_sessions_user_date_idx ON study_sessions (user_id, session_date);
CREATE INDEX IF NOT EXISTS study_sessions_subject_idx ON study_sessions (subject_id);
CREATE INDEX IF NOT EXISTS study_sessions_exam_idx ON study_sessions (exam_id);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON study_sessions TO authenticated;

DROP POLICY IF EXISTS "select_own_study_sessions" ON study_sessions;
CREATE POLICY "select_own_study_sessions" ON study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_sessions" ON study_sessions;
CREATE POLICY "insert_own_study_sessions" ON study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_sessions" ON study_sessions;
CREATE POLICY "update_own_study_sessions" ON study_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_sessions" ON study_sessions;
CREATE POLICY "delete_own_study_sessions" ON study_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
