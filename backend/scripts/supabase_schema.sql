-- SQL Schema script for Folusho Victory Schools Result Management Portal on Supabase PostgreSQL

-- Enable extension for UUID if needed, though we primarily use custom String IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(100) PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    email VARCHAR(254),
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "passwordHash" VARCHAR(255),
    portal VARCHAR(50),
    "displayName" VARCHAR(100),
    "studentId" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    "formTeacherUsername" VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students Table
CREATE TABLE IF NOT EXISTS students (
    "studentId" VARCHAR(50) PRIMARY KEY,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    email VARCHAR(254),
    phone VARCHAR(20),
    stream VARCHAR(50),
    "subjectIds" JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    stream VARCHAR(50),
    track VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(100) PRIMARY KEY,
    "teacherUsername" VARCHAR(100) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    "subjectId" VARCHAR(100) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Scores Table
CREATE TABLE IF NOT EXISTS scores (
    id VARCHAR(100) PRIMARY KEY,
    session VARCHAR(50) NOT NULL,
    term VARCHAR(50) NOT NULL,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    "studentId" VARCHAR(50) NOT NULL REFERENCES students("studentId") ON DELETE CASCADE,
    "subjectId" VARCHAR(100) NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'NUMERIC' or 'TRAIT'
    ca1 NUMERIC DEFAULT 0,
    ca2 NUMERIC DEFAULT 0,
    ca NUMERIC DEFAULT 0,
    exam NUMERIC DEFAULT 0,
    rating VARCHAR(50),
    "enteredBy" VARCHAR(100),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Remarks Table
CREATE TABLE IF NOT EXISTS remarks (
    id VARCHAR(100) PRIMARY KEY,
    "studentId" VARCHAR(50) NOT NULL REFERENCES students("studentId") ON DELETE CASCADE,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL,
    term VARCHAR(50) NOT NULL,
    "principalRemarks" TEXT,
    "teacherRemarks" TEXT,
    "principalName" VARCHAR(100),
    "teacherName" VARCHAR(100),
    attendance INT DEFAULT 0,
    "maxAttendance" INT DEFAULT 0,
    cognitive JSONB DEFAULT '{}'::jsonb,
    psychomotor JSONB DEFAULT '{}'::jsonb,
    affective JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Publishes Table
CREATE TABLE IF NOT EXISTS publishes (
    id VARCHAR(100) PRIMARY KEY,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL,
    term VARCHAR(50) NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Releases Table
CREATE TABLE IF NOT EXISTS releases (
    id VARCHAR(100) PRIMARY KEY,
    "classId" VARCHAR(100) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session VARCHAR(50) NOT NULL,
    term VARCHAR(50) NOT NULL,
    released BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Config Table
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Counters Table
CREATE TABLE IF NOT EXISTS counters (
    key VARCHAR(100) PRIMARY KEY,
    value INT DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize standard indices for fast data loads and computations
CREATE INDEX IF NOT EXISTS idx_scores_lookup ON scores(session, term, "classId");
CREATE INDEX IF NOT EXISTS idx_scores_student ON scores(session, term, "studentId");
CREATE INDEX IF NOT EXISTS idx_remarks_lookup ON remarks(session, term, "studentId");
CREATE INDEX IF NOT EXISTS idx_students_class ON students("classId");
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments("teacherUsername");
CREATE INDEX IF NOT EXISTS idx_assignments_composite ON assignments("classId", "subjectId");
