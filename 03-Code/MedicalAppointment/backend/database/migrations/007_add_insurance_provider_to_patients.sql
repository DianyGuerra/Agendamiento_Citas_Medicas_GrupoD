/**
 * Migration: Add Insurance Provider Reference to Patients Table
 * 
 * This migration adds a reference to the insurance_providers table
 * allowing patients to select their insurance provider from the catalog.
 * 
 * The existing insurance_plan and insurance_number columns are kept
 * for backward compatibility and additional details.
 */

-- Add insurance_provider_id column to patients table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'patients' AND column_name = 'insurance_provider_id') THEN
        ALTER TABLE patients ADD COLUMN insurance_provider_id UUID REFERENCES insurance_providers(id);
        
        COMMENT ON COLUMN patients.insurance_provider_id IS 'Reference to insurance_providers table for patient insurance';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_insurance_provider ON patients(insurance_provider_id);

-- Drop existing view first (required because column structure is changing)
DROP VIEW IF EXISTS vw_patients_full;

-- Recreate view with insurance provider details
CREATE VIEW vw_patients_full AS
SELECT 
    p.id as patient_id,
    p.user_id,
    p.date_of_birth,
    p.gender,
    p.address,
    p.city,
    p.state,
    p.postal_code,
    p.country,
    p.insurance_provider_id,
    ip.name as insurance_provider_name,
    ip.code as insurance_provider_code,
    ip.discount_percentage as insurance_discount_percentage,
    p.insurance_plan,
    p.insurance_number,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.emergency_contact_relation,
    p.allergies,
    p.medical_conditions,
    p.current_medications,
    p.blood_type,
    p.height,
    p.weight,
    p.home_phone,
    u.email,
    u.first_name,
    u.last_name,
    u.phone_number,
    u.cedula
FROM patients p
INNER JOIN users u ON p.user_id = u.id
LEFT JOIN insurance_providers ip ON p.insurance_provider_id = ip.id;
