/*
# Create subject notes table

## Plain-English summary
Stores one free-text note per subject, so students can keep their summaries and remarks next to each subject.

## New tables
1. `subject_notes`
   - `subject_id` (uuid, primary key, the subject the note belongs to; removed together with the subject)
   - `user_id` (uuid, owner, defaults to the signed-in student)
   - `body` (text, the note; up to 20,000 characters)
   - `updated_at` (timestamp)

## Security
- Row level security is enabled on `subject_notes`.
- Only the `authenticated` role receives access, and only to its own rows.
- Four separate policies check `auth.uid() = user_id`; inserts and updates also require the subject to belong to the same student.
- Anonymous access is revoked.

## Important notes
1. No existing tables are modified or dropped.
2. Every statement is idempotent, so the migration can be safely re-run.
*/

CREATE TABLE IF NOT EXISTS subject_notes (
  subject_id uuid PRIMARY KEY REFERENCES subjects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 20000),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subject_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON subject_notes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON subject_notes TO authenticated;

DROP POLICY IF EXISTS "select_own_subject_notes" ON subject_notes;
CREATE POLICY "select_own_subject_notes" ON subject_notes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subject_notes" ON subject_notes;
CREATE POLICY "insert_own_subject_notes" ON subject_notes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = subject_notes.subject_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_subject_notes" ON subject_notes;
CREATE POLICY "update_own_subject_notes" ON subject_notes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = subject_notes.subject_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_subject_notes" ON subject_notes;
CREATE POLICY "delete_own_subject_notes" ON subject_notes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
