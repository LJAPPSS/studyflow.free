/*
# Create focus sessions table for finished focus-timer blocks

## Plain-English summary
Stores each finished focus block from the Focus-timer, so study statistics can include time spent focusing that is not part of the planner.

## New tables
1. `focus_sessions`
   - `id` (uuid, primary key)
   - `user_id` (uuid, owner, defaults to the signed-in student, removed with the account)
   - `subject_id` (uuid, optional subject chosen in the timer; cleared if the subject is removed)
   - `session_date` (date, the local day the block was finished)
   - `duration_minutes` (integer, length of the block, must be positive)
   - `created_at` (timestamp)

## Security
- Row level security is enabled on `focus_sessions`.
- Only the `authenticated` role receives access, and only to its own rows.
- Separate policies for select and insert check `auth.uid() = user_id`.
- Privileges granted: SELECT, INSERT to `authenticated` only.

## Important notes
1. No existing tables are modified or dropped.
2. Every statement is idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), so the migration can be safely re-run.
3. An index is added for the owner and date to keep statistics queries fast.
*/

CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS focus_sessions_user_date_idx ON focus_sessions (user_id, session_date);
CREATE INDEX IF NOT EXISTS focus_sessions_subject_idx ON focus_sessions (subject_id);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON focus_sessions TO authenticated;

DROP POLICY IF EXISTS "select_own_focus_sessions" ON focus_sessions;
CREATE POLICY "select_own_focus_sessions" ON focus_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_focus_sessions" ON focus_sessions;
CREATE POLICY "insert_own_focus_sessions" ON focus_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
