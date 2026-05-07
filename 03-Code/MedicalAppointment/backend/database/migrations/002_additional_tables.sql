-- ============================================================================
-- Medical Appointment System - Additional Tables Migration
-- Version: 2.0
-- Description: Creates tables for waiting list, doctor ratings, and updates
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. WAITING LIST TABLE
-- ============================================================================
-- Table for managing patient waiting list for appointments

CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    preferred_date DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    reason TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'cancelled', 'expired')),
    notified_at TIMESTAMPTZ,
    booked_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waiting_list
CREATE INDEX IF NOT EXISTS idx_waiting_list_patient ON waiting_list(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_doctor ON waiting_list(doctor_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status);
CREATE INDEX IF NOT EXISTS idx_waiting_list_active ON waiting_list(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. DOCTOR RATINGS TABLE
-- ============================================================================
-- Table for storing patient ratings and reviews for doctors

CREATE TABLE IF NOT EXISTS doctor_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    attention_rating INTEGER CHECK (attention_rating >= 1 AND attention_rating <= 5),
    recommendation_rating INTEGER CHECK (recommendation_rating >= 1 AND recommendation_rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for doctor_ratings
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_doctor ON doctor_ratings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_patient ON doctor_ratings(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_appointment ON doctor_ratings(appointment_id);
CREATE INDEX IF NOT EXISTS idx_doctor_ratings_active ON doctor_ratings(is_active) WHERE is_active = true;

-- Unique constraint: one rating per appointment
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_ratings_unique_appointment 
ON doctor_ratings(appointment_id) WHERE appointment_id IS NOT NULL AND is_active = true;

-- ============================================================================
-- 3. UPDATE APPOINTMENTS TABLE
-- ============================================================================
-- Add new columns if they don't exist

DO $$ 
BEGIN
    -- Add confirmed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'confirmed_at') THEN
        ALTER TABLE appointments ADD COLUMN confirmed_at TIMESTAMPTZ;
    END IF;

    -- Add started_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'started_at') THEN
        ALTER TABLE appointments ADD COLUMN started_at TIMESTAMPTZ;
    END IF;

    -- Add completed_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'completed_at') THEN
        ALTER TABLE appointments ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    -- Add checked_in_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'checked_in_at') THEN
        ALTER TABLE appointments ADD COLUMN checked_in_at TIMESTAMPTZ;
    END IF;

    -- Add consultation_room_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'consultation_room_id') THEN
        ALTER TABLE appointments ADD COLUMN consultation_room_id UUID REFERENCES consultation_rooms(id);
    END IF;
END $$;

-- ============================================================================
-- 4. UPDATE CONSULTATION ROOMS TABLE
-- ============================================================================
-- Add new columns if they don't exist

DO $$ 
BEGIN
    -- Add equipment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_rooms' AND column_name = 'equipment') THEN
        ALTER TABLE consultation_rooms ADD COLUMN equipment TEXT;
    END IF;

    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_rooms' AND column_name = 'notes') THEN
        ALTER TABLE consultation_rooms ADD COLUMN notes TEXT;
    END IF;

    -- Add capacity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_rooms' AND column_name = 'capacity') THEN
        ALTER TABLE consultation_rooms ADD COLUMN capacity INTEGER DEFAULT 1;
    END IF;
END $$;

-- ============================================================================
-- 5. UPDATE CONSULTATION NOTES TABLE
-- ============================================================================
-- Add SOAP format columns if they don't exist

DO $$ 
BEGIN
    -- Add subjective column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_notes' AND column_name = 'subjective') THEN
        ALTER TABLE consultation_notes ADD COLUMN subjective TEXT;
    END IF;

    -- Add objective column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_notes' AND column_name = 'objective') THEN
        ALTER TABLE consultation_notes ADD COLUMN objective TEXT;
    END IF;

    -- Add assessment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_notes' AND column_name = 'assessment') THEN
        ALTER TABLE consultation_notes ADD COLUMN assessment TEXT;
    END IF;

    -- Add plan column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_notes' AND column_name = 'plan') THEN
        ALTER TABLE consultation_notes ADD COLUMN plan TEXT;
    END IF;

    -- Add follow_up_required column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_notes' AND column_name = 'follow_up_required') THEN
        ALTER TABLE consultation_notes ADD COLUMN follow_up_required BOOLEAN DEFAULT false;
    END IF;

    -- Add follow_up_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consultation_notes' AND column_name = 'follow_up_date') THEN
        ALTER TABLE consultation_notes ADD COLUMN follow_up_date DATE;
    END IF;
END $$;

-- ============================================================================
-- 6. VIEWS FOR AGGREGATED DATA
-- ============================================================================

-- View for doctor average ratings
CREATE OR REPLACE VIEW doctor_average_ratings AS
SELECT 
    d.id as doctor_id,
    d.user_id,
    u.first_name,
    u.last_name,
    s.name as specialty_name,
    COUNT(dr.id) as total_ratings,
    ROUND(AVG(dr.rating)::numeric, 2) as average_rating,
    ROUND(AVG(dr.punctuality_rating)::numeric, 2) as average_punctuality,
    ROUND(AVG(dr.attention_rating)::numeric, 2) as average_attention,
    ROUND(AVG(dr.recommendation_rating)::numeric, 2) as average_recommendation
FROM doctors d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN specialties s ON d.specialty_id = s.id
LEFT JOIN doctor_ratings dr ON d.id = dr.doctor_id AND dr.is_active = true
GROUP BY d.id, d.user_id, u.first_name, u.last_name, s.name;

-- ============================================================================
-- 7. RLS POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_ratings ENABLE ROW LEVEL SECURITY;

-- Waiting List Policies
DROP POLICY IF EXISTS "Patients can view their own waiting list entries" ON waiting_list;
CREATE POLICY "Patients can view their own waiting list entries"
ON waiting_list FOR SELECT
USING (auth.uid() = patient_user_id);

DROP POLICY IF EXISTS "Patients can insert into waiting list" ON waiting_list;
CREATE POLICY "Patients can insert into waiting list"
ON waiting_list FOR INSERT
WITH CHECK (auth.uid() = patient_user_id);

DROP POLICY IF EXISTS "Patients can delete their own entries" ON waiting_list;
CREATE POLICY "Patients can delete their own entries"
ON waiting_list FOR DELETE
USING (auth.uid() = patient_user_id);

-- Doctor Ratings Policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON doctor_ratings;
CREATE POLICY "Anyone can view ratings"
ON doctor_ratings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Patients can create ratings" ON doctor_ratings;
CREATE POLICY "Patients can create ratings"
ON doctor_ratings FOR INSERT
WITH CHECK (auth.uid() = patient_user_id);

DROP POLICY IF EXISTS "Patients can update their own ratings" ON doctor_ratings;
CREATE POLICY "Patients can update their own ratings"
ON doctor_ratings FOR UPDATE
USING (auth.uid() = patient_user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE waiting_list IS 'Stores patient waiting list entries for appointment slots';
COMMENT ON TABLE doctor_ratings IS 'Stores patient ratings and reviews for doctors';
