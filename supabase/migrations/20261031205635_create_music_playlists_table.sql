/*
# Create music playlists table

1. New Tables
- `music_playlists`: saved Spotify or YouTube links the student wants to play while studying.
  - `id` (uuid, primary key)
  - `user_id` (uuid, defaults to the signed-in user)
  - `label` (text, 1 to 80 characters, chosen by the student)
  - `provider` (text, either 'spotify' or 'youtube')
  - `embed_url` (text, the player address; limited to the Spotify and YouTube embed hosts)
  - `source_url` (text, the link the student pasted)
  - `created_at` (timestamptz)

2. Security
- Row level security enabled.
- Grants only to `authenticated`, for select, insert and delete (no edits; a link is replaced by deleting and adding again).
- Owner-scoped policies so each student only sees and manages their own playlists.

3. Notes
- Existing data in other tables is not changed.
*/

CREATE TABLE IF NOT EXISTS music_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  provider text NOT NULL CHECK (provider IN ('spotify', 'youtube')),
  embed_url text NOT NULL CHECK (
    embed_url LIKE 'https://open.spotify.com/embed/%' OR embed_url LIKE 'https://www.youtube.com/embed/%'
  ),
  source_url text NOT NULL CHECK (char_length(source_url) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS music_playlists_user_idx ON music_playlists (user_id);

ALTER TABLE music_playlists ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON music_playlists TO authenticated;

DROP POLICY IF EXISTS "select_own_music_playlists" ON music_playlists;
CREATE POLICY "select_own_music_playlists" ON music_playlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_music_playlists" ON music_playlists;
CREATE POLICY "insert_own_music_playlists" ON music_playlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_music_playlists" ON music_playlists;
CREATE POLICY "delete_own_music_playlists" ON music_playlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
