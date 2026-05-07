-- Migration: Add status column to schedule_exceptions for approval workflow
-- Run this in Supabase SQL Editor

-- Add status column for approval workflow
ALTER TABLE schedule_exceptions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Add admin_notes column for admin responses
ALTER TABLE schedule_exceptions 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add reviewed_at column for tracking when it was reviewed
ALTER TABLE schedule_exceptions 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add reviewed_by column to track which admin reviewed it
ALTER TABLE schedule_exceptions 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_status ON schedule_exceptions(status);

-- Create index for doctor_id + status queries
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_doctor_status ON schedule_exceptions(doctor_id, status);

-- Update existing records to 'approved' (they were already in use)
UPDATE schedule_exceptions 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';

-- COMMENT: Valid status values are:
-- 'pending' - Waiting for admin approval
-- 'approved' - Approved by admin
-- 'rejected' - Rejected by admin
