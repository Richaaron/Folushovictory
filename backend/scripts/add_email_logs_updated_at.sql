-- Existing logs tables may predate the updatedAt column expected by SafeDatabase.
ALTER TABLE logs
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
