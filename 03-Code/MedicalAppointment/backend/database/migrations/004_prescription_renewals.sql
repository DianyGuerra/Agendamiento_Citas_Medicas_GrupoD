-- Prescription Renewals Table
-- Stores requests for prescription renewals from patients to doctors

CREATE TABLE IF NOT EXISTS prescription_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    original_prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    new_prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    
    -- Request details
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    request_reason TEXT,
    patient_notes TEXT,
    doctor_response TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_prescription_renewals_patient ON prescription_renewals(patient_user_id);
CREATE INDEX idx_prescription_renewals_doctor ON prescription_renewals(doctor_id);
CREATE INDEX idx_prescription_renewals_status ON prescription_renewals(status);
CREATE INDEX idx_prescription_renewals_original ON prescription_renewals(original_prescription_id);

-- Add trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_prescription_renewals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prescription_renewals_updated_at
    BEFORE UPDATE ON prescription_renewals
    FOR EACH ROW
    EXECUTE FUNCTION update_prescription_renewals_updated_at();

-- Comments for documentation
COMMENT ON TABLE prescription_renewals IS 'Stores prescription renewal requests from patients';
COMMENT ON COLUMN prescription_renewals.status IS 'pending: awaiting doctor review, approved: new prescription created, rejected: doctor denied renewal, cancelled: patient cancelled request';
COMMENT ON COLUMN prescription_renewals.new_prescription_id IS 'Reference to the new prescription created when renewal is approved';
