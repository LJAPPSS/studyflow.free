/*
# Harden ownership of linked rows and remove anonymous table access

1. Plain-English summary
- A row a user creates can only point at other rows that also belong to that user (for example an exam can only link to one of the user's own subjects).
- The anonymous role loses all table privileges, because the app requires sign-in and anonymous access was never used.

2. Modified policies (insert and update only, same names)
- exams: subject_id and exam_period_id must reference the user's own rows.
- exam_periods: school_year_id must reference the user's own school year.
- folders: parent_id and subject_id must reference the user's own rows.
- files: folder_id must reference the user's own folder.

3. Security changes
- Revoke all table privileges from the anon role on public tables and storage objects/buckets.
- No data is changed or removed.

4. Notes
- Select, update-using and delete policies are unchanged.
- Null links remain allowed (a link is optional).
*/

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON storage.objects, storage.buckets FROM anon;

DROP POLICY IF EXISTS "insert_own_exams" ON exams;
CREATE POLICY "insert_own_exams" ON exams FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (subject_id IS NULL OR EXISTS (SELECT 1 FROM subjects s WHERE s.id = exams.subject_id AND s.user_id = auth.uid()))
  AND (exam_period_id IS NULL OR EXISTS (SELECT 1 FROM exam_periods p WHERE p.id = exams.exam_period_id AND p.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "update_own_exams" ON exams;
CREATE POLICY "update_own_exams" ON exams FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (subject_id IS NULL OR EXISTS (SELECT 1 FROM subjects s WHERE s.id = exams.subject_id AND s.user_id = auth.uid()))
  AND (exam_period_id IS NULL OR EXISTS (SELECT 1 FROM exam_periods p WHERE p.id = exams.exam_period_id AND p.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "insert_own_exam_periods" ON exam_periods;
CREATE POLICY "insert_own_exam_periods" ON exam_periods FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (school_year_id IS NULL OR EXISTS (SELECT 1 FROM school_years y WHERE y.id = exam_periods.school_year_id AND y.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "update_own_exam_periods" ON exam_periods;
CREATE POLICY "update_own_exam_periods" ON exam_periods FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (school_year_id IS NULL OR EXISTS (SELECT 1 FROM school_years y WHERE y.id = exam_periods.school_year_id AND y.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "insert_own_folders" ON folders;
CREATE POLICY "insert_own_folders" ON folders FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (parent_id IS NULL OR EXISTS (SELECT 1 FROM folders p WHERE p.id = folders.parent_id AND p.user_id = auth.uid()))
  AND (subject_id IS NULL OR EXISTS (SELECT 1 FROM subjects s WHERE s.id = folders.subject_id AND s.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "update_own_folders" ON folders;
CREATE POLICY "update_own_folders" ON folders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (parent_id IS NULL OR EXISTS (SELECT 1 FROM folders p WHERE p.id = folders.parent_id AND p.user_id = auth.uid()))
  AND (subject_id IS NULL OR EXISTS (SELECT 1 FROM subjects s WHERE s.id = folders.subject_id AND s.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "insert_own_files" ON files;
CREATE POLICY "insert_own_files" ON files FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (folder_id IS NULL OR EXISTS (SELECT 1 FROM folders f WHERE f.id = files.folder_id AND f.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "update_own_files" ON files;
CREATE POLICY "update_own_files" ON files FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (folder_id IS NULL OR EXISTS (SELECT 1 FROM folders f WHERE f.id = files.folder_id AND f.user_id = auth.uid()))
);
