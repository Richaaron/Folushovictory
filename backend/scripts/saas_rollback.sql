-- SQL Rollback Script to revert Multi-Tenant SaaS changes

-- 1. Drop the indexes
DROP INDEX IF EXISTS idx_users_tenant;
DROP INDEX IF EXISTS idx_classes_tenant;
DROP INDEX IF EXISTS idx_students_tenant;
DROP INDEX IF EXISTS idx_subjects_tenant;
DROP INDEX IF EXISTS idx_scores_tenant;
DROP INDEX IF EXISTS idx_remarks_tenant;

-- 2. Drop the tenantId column from all tables
DO $$ 
DECLARE
    t_name text;
    tables text[] := ARRAY['users', 'classes', 'students', 'subjects', 'assignments', 'scores', 'remarks', 'publishes', 'releases', 'config', 'counters'];
BEGIN
    FOREACH t_name IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "tenantId" CASCADE', t_name);
    END LOOP;
END $$;

-- 3. Drop the tenants table
DROP TABLE IF EXISTS tenants CASCADE;

-- Done. Database is fully restored to single-tenant state.
