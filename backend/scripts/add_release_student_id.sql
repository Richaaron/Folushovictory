-- Fix production Supabase releases table for per-student result release.
-- Run this once in Supabase SQL Editor before retrying the Release button.

ALTER TABLE releases
ADD COLUMN IF NOT EXISTS "studentId" VARCHAR(100);

UPDATE releases
SET "studentId" = split_part(id, '_', 3)
WHERE ("studentId" IS NULL OR "studentId" = '')
  AND array_length(string_to_array(id, '_'), 1) >= 3;

DELETE FROM releases
WHERE "studentId" IS NULL
   OR "studentId" = ''
   OR NOT EXISTS (
      SELECT 1
      FROM students
      WHERE students."studentId" = releases."studentId"
   );

ALTER TABLE releases
ALTER COLUMN "studentId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'releases_studentId_fkey'
  ) THEN
    ALTER TABLE releases
    ADD CONSTRAINT "releases_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES students("studentId") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_releases_student_session_term
ON releases ("studentId", session, term);
