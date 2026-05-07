-- Migration: Add unique constraint to doctor_schedules table
-- This allows upsert operations on (doctor_id, day_of_week)

-- First, remove any duplicate entries (keep the most recent one)
DELETE FROM doctor_schedules a
USING doctor_schedules b
WHERE a.doctor_id = b.doctor_id 
  AND a.day_of_week = b.day_of_week 
  AND a.id < b.id;

-- Add unique constraint
ALTER TABLE doctor_schedules 
ADD CONSTRAINT doctor_schedules_doctor_day_unique 
UNIQUE (doctor_id, day_of_week);
