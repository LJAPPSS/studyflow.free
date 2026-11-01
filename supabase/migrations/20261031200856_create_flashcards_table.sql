/*
# Create flashcards table

1. New Tables
- `flashcards`: one study card per row, belonging to a subject.
  - `id` (uuid, primary key)
  - `user_id` (uuid, defaults to the signed-in user)
  - `subject_id` (uuid, references the student's own subject; deleting a subject removes its cards)
  - `front` (text, the question or term, 1 to 500 characters)
  - `back` (text, the answer or explanation, 1 to 1000 characters)
  - `created_at` (timestamptz)

2. Security
- Row level security enabled.
- Grants only to `authenticated`, for select, insert, update and delete.
- Four owner-scoped policies. Inserts and updates also require the subject to belong to the same user.

3. Notes
- Existing data in other tables is not changed.
*/

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  front text NOT NULL CHECK (char_length(front) BETWEEN 1 AND 500),
  back text NOT NULL CHECK (char_length(back) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flashcards_user_idx ON flashcards (user_id);
CREATE INDEX IF NOT EXISTS flashcards_subject_idx ON flashcards (subject_id);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON flashcards TO authenticated;

DROP POLICY IF EXISTS "select_own_flashcards" ON flashcards;
CREATE POLICY "select_own_flashcards" ON flashcards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_flashcards" ON flashcards;
CREATE POLICY "insert_own_flashcards" ON flashcards FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = flashcards.subject_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_flashcards" ON flashcards;
CREATE POLICY "update_own_flashcards" ON flashcards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM subjects s WHERE s.id = flashcards.subject_id AND s.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_flashcards" ON flashcards;
CREATE POLICY "delete_own_flashcards" ON flashcards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
