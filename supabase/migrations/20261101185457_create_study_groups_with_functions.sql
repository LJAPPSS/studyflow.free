/*
# Create study groups with secure membership functions

## Plain-English summary
Students can create a study group, share its invite code with classmates, and join a group with that code. Members see each other's names and how many minutes they studied this week. Nothing else about other students is visible.

## New tables
1. `study_groups`: `id`, `name` (1-60 characters), `invite_code` (unique 8-character code), `created_at`.
2. `study_group_members`: `group_id`, `user_id` (defaults to the signed-in student), `joined_at`. One row per student per group.

## New functions
1. `create_study_group(p_name)`: creates a group and adds the caller as its first member.
2. `join_study_group(p_code)`: adds the caller to the group with that invite code.
3. `group_member_overview(p_group, p_since)`: returns each member's display name and minutes studied since a date. Only members of the group may call it, and it returns totals only.

## Security
- Row level security is enabled on both tables.
- Students can read only the groups they belong to, and only their own membership rows.
- Students can leave a group by deleting their own membership row.
- Groups and memberships cannot be changed directly; creating and joining go through the functions above.
- The functions run with elevated rights, so they check the caller's identity themselves. Only the `authenticated` role may execute them.
- Anonymous access is revoked.

## Important notes
1. No existing tables are modified or dropped.
2. Every statement is idempotent, so the migration can be safely re-run.
*/

CREATE TABLE IF NOT EXISTS study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 60),
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_group_members (
  group_id uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS study_group_members_user_idx ON study_group_members (user_id);

ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON study_groups FROM anon;
REVOKE ALL ON study_group_members FROM anon;
GRANT SELECT ON study_groups TO authenticated;
GRANT SELECT, DELETE ON study_group_members TO authenticated;

DROP POLICY IF EXISTS "select_member_study_groups" ON study_groups;
CREATE POLICY "select_member_study_groups" ON study_groups FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members m
      WHERE m.group_id = study_groups.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "select_own_study_group_members" ON study_group_members;
CREATE POLICY "select_own_study_group_members" ON study_group_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_group_members" ON study_group_members;
CREATE POLICY "delete_own_study_group_members" ON study_group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION create_study_group(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_group uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  INSERT INTO study_groups (name) VALUES (btrim(p_name)) RETURNING id INTO v_group;
  INSERT INTO study_group_members (group_id, user_id) VALUES (v_group, v_user);

  RETURN v_group;
END;
$$;

CREATE OR REPLACE FUNCTION join_study_group(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_group uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT g.id INTO v_group FROM study_groups g WHERE g.invite_code = upper(btrim(p_code));
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'invalid invite code' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO study_group_members (group_id, user_id) VALUES (v_group, v_user)
  ON CONFLICT DO NOTHING;

  RETURN v_group;
END;
$$;

CREATE OR REPLACE FUNCTION group_member_overview(p_group uuid, p_since date)
RETURNS TABLE (member_user_id uuid, member_name text, member_minutes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM study_group_members m WHERE m.group_id = p_group AND m.user_id = v_user
  ) THEN
    RAISE EXCEPTION 'not a member of this group' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    m.user_id,
    COALESCE(p.display_name, 'Onbekend')::text,
    (
      COALESCE((
        SELECT SUM(s.duration_minutes) FROM study_sessions s
        WHERE s.user_id = m.user_id AND s.completed AND s.session_date >= p_since
      ), 0)
      + COALESCE((
        SELECT SUM(f.duration_minutes) FROM focus_sessions f
        WHERE f.user_id = m.user_id AND f.session_date >= p_since
      ), 0)
    )::integer
  FROM study_group_members m
  LEFT JOIN profiles p ON p.user_id = m.user_id
  WHERE m.group_id = p_group
  ORDER BY 3 DESC, 2 ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_study_group(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION join_study_group(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION group_member_overview(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION create_study_group(text) TO authenticated;
GRANT EXECUTE ON FUNCTION join_study_group(text) TO authenticated;
GRANT EXECUTE ON FUNCTION group_member_overview(uuid, date) TO authenticated;
