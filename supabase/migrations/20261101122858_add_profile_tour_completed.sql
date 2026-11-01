/*
# Add guided tour completion flag to profiles

1. Modified Tables
- `profiles`: new column `tour_completed` (boolean, not null, default false). It records whether the student has finished or skipped the in-app guided tour.

2. Existing data
- Students who already completed onboarding are marked as having completed the tour, so they are not shown the tour again after this change.

3. Security
- No new policies or grants are needed. The existing row-level security on `profiles` already limits each student to their own row, and the table-level UPDATE grant covers the new column.

4. Notes
- Existing rows are never deleted or changed in any other way.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tour_completed boolean NOT NULL DEFAULT false;

UPDATE profiles SET tour_completed = true WHERE onboarding_completed = true AND tour_completed = false;
