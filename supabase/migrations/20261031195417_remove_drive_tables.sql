DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS folders;

DROP POLICY IF EXISTS "drive_select_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "drive_insert_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "drive_update_own_objects" ON storage.objects;
DROP POLICY IF EXISTS "drive_delete_own_objects" ON storage.objects;
