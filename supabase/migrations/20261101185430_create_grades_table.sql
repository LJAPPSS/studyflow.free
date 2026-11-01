/*
# Create grades table

## Plain-English summary
Stores the grades a student receives for each subject, so the app can show grades and averages per subject.

## New tables
1. `grades`
   - `id` (uuid, primary key)
   - `user_id` (uuid, owner, defaults to the signed-in student, removed with the account)
   - `subject_id` (uuid, the subject the grade belongs to; removed together with the subject)
   - `title` (text, optional description such as "Toets hoofdstuk 3")
   - `grade` (numeric, between 1 and 10 with one decimal)
   - `weight` (numeric, positive, default 1; used for weighted averages)
   - `grade_date` (date, the day the grade was received)
   - `created_at` (timestamp)

## Security
- Row level security is enabled on `grades`.
- Only the `authenticated` role receives access, and only to its own rows.
- Four separate policies (select, insert, update, delete) check `auth.uid() = user_id`.
- Inserts and updates also require that the chosen subject belongs to the same student.
- Anonymous access is revoked.

## Important notes
1. No existing tables are modified or dropped.
2. Every statement is idempotent, so the migration can be safely re-run.
*/

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text,
  grade numeric(3,1) NOT NULL CHECK (grade >= 1 AND grade <= 10),
  weight numeric(4,2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  grade_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grades_user_subject_idx ON grades (user_id, subject_id);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON grades FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON grades TO authenticated;

DROP POLICY IF EXISTS "select_own_grades" ON grades;
CREATE POLICY "select_own_grades" ON grades FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_grades" ON grades;
CREATE POLICY "insert_own_grades" ON grades FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = grades.subject_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_grades" ON grades;
CREATE POLICY "update_own_grades" ON grades FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = grades.subject_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_grades" ON grades;
CREATE POLICY "delete_own_grades" ON grades FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
