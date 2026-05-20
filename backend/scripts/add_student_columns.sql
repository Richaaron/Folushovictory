-- Migration: Add missing columns to students table
-- Run this in your Supabase SQL Editor at: https://supabase.com/dashboard → SQL Editor

ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentName" VARCHAR(150);
ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentEmail" VARCHAR(254);
ALTER TABLE students ADD COLUMN IF NOT EXISTS "createdBy" VARCHAR(100);
