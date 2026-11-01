/*
# Add colour to Drive folders

1. Modified tables
- `folders`: new nullable column `color` (text). NULL means the folder keeps the default look.

2. Allowed values
- Only the keys of the app's existing colour palette are accepted (blue, pink, violet, red, yellow, orange, green, teal, cyan, brown, slate), enforced by a CHECK constraint.

3. Security
- No change to RLS policies or grants. Existing folder ownership rules still apply to the new column.

4. Notes
- Existing folders are untouched; their colour starts as NULL.
- Idempotent: the column and constraint are only added if missing.
*/

ALTER TABLE folders ADD COLUMN IF NOT EXISTS color text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'folders_color_check' AND conrelid = 'folders'::regclass
  ) THEN
    ALTER TABLE folders ADD CONSTRAINT folders_color_check CHECK (
      color IS NULL OR color IN ('blue','pink','violet','red','yellow','orange','green','teal','cyan','brown','slate')
    );
  END IF;
END $$;
