-- Required by direct teacher enrollment and teacher profile fallback.
ALTER TABLE users ADD COLUMN IF NOT EXISTS "teacherType" VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "formClassId" VARCHAR(100);
