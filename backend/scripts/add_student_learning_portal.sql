CREATE TABLE IF NOT EXISTS "learningActivities" (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ASSIGNMENT', 'TEST')),
    description TEXT,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    "subjectId" VARCHAR(100) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    "teacherUsername" VARCHAR(100) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    "dueAt" TIMESTAMP WITH TIME ZONE,
    "maxScore" NUMERIC NOT NULL DEFAULT 100,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "activitySubmissions" (
    id VARCHAR(100) PRIMARY KEY,
    "activityId" VARCHAR(100) NOT NULL REFERENCES "learningActivities"(id) ON DELETE CASCADE,
    "studentId" VARCHAR(50) NOT NULL REFERENCES students("studentId") ON DELETE CASCADE,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    score NUMERIC,
    feedback TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUBMITTED', 'GRADED')),
    "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("activityId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_learning_activities_class ON "learningActivities"("classId", published);
CREATE INDEX IF NOT EXISTS idx_learning_activities_teacher ON "learningActivities"("teacherUsername");
CREATE INDEX IF NOT EXISTS idx_activity_submissions_student ON "activitySubmissions"("studentId");
CREATE INDEX IF NOT EXISTS idx_activity_submissions_activity ON "activitySubmissions"("activityId");
