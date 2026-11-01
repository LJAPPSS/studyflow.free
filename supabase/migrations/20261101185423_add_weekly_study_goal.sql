/*
# Add weekly study goal to profiles

## Plain-English summary
Each student can set a weekly study goal in minutes. Empty means no goal is set.

## Modified tables
1. `profiles`
   - New column `weekly_goal_minutes` (integer, optional, must be positive when set).

## Security
- No new policies or grants. The existing owner-only policies on `profiles` cover the new column.

## Important notes
1. No existing data is changed.
2. The statement is idempotent (IF NOT EXISTS), so it can be re-run safely.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal_minutes integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_weekly_goal_minutes_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_weekly_goal_minutes_check
      CHECK (weekly_goal_minutes IS NULL OR weekly_goal_minutes > 0);
  END IF;
END $$;
