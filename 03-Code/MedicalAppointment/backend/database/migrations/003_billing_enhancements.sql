-- ============================================================================
-- Medical Appointment System - Billing Enhancements Migration
-- Version: 3.0
-- Description: Adds configurable pricing and services for billing
-- ============================================================================

-- ============================================================================
-- 1. ADD CONSULTATION_FEE TO SPECIALTIES
-- ============================================================================
-- Each specialty can have its own base consultation fee

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'specialties' AND column_name = 'consultation_fee') THEN
        ALTER TABLE specialties ADD COLUMN consultation_fee DECIMAL(10,2) DEFAULT 50.00;
    END IF;
END $$;

-- Update existing specialties with default fees
UPDATE specialties SET consultation_fee = 75.00 WHERE LOWER(name) = 'cardiología' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 65.00 WHERE LOWER(name) = 'dermatología' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 60.00 WHERE LOWER(name) = 'pediatría' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 70.00 WHERE LOWER(name) = 'ginecología' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 75.00 WHERE LOWER(name) = 'traumatología' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 80.00 WHERE LOWER(name) = 'neurología' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 70.00 WHERE LOWER(name) = 'psiquiatría' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 65.00 WHERE LOWER(name) = 'oftalmología' AND consultation_fee IS NULL;
UPDATE specialties SET consultation_fee = 50.00 WHERE consultation_fee IS NULL;

-- ============================================================================
-- 2. MEDICAL SERVICES TABLE
-- ============================================================================
-- Catalog of medical services that can be added to billing

CREATE TABLE IF NOT EXISTS medical_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    base_price DECIMAL(10,2) NOT NULL,
    specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_services_specialty ON medical_services(specialty_id);
CREATE INDEX IF NOT EXISTS idx_medical_services_category ON medical_services(category);
CREATE INDEX IF NOT EXISTS idx_medical_services_active ON medical_services(is_active) WHERE is_active = true;

-- ============================================================================
-- 3. BILLING LINE ITEMS TABLE
-- ============================================================================
-- Individual items/services in a billing

CREATE TABLE IF NOT EXISTS billing_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_id UUID NOT NULL REFERENCES billings(id) ON DELETE CASCADE,
    service_id UUID REFERENCES medical_services(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    added_by_user_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_items_billing ON billing_items(billing_id);
CREATE INDEX IF NOT EXISTS idx_billing_items_service ON billing_items(service_id);

-- ============================================================================
-- 4. INSURANCE PROVIDERS TABLE
-- ============================================================================
-- Registered insurance providers with their discount rates

CREATE TABLE IF NOT EXISTS insurance_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) UNIQUE,
    discount_percentage DECIMAL(5,2) DEFAULT 15.00,
    coverage_types TEXT[], -- Array of covered service categories
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common insurance providers
INSERT INTO insurance_providers (name, code, discount_percentage, coverage_types) VALUES
('IESS', 'IESS', 20.00, ARRAY['consultation', 'laboratory', 'imaging']),
('Seguros Equinoccial', 'EQUI', 25.00, ARRAY['consultation', 'laboratory', 'imaging', 'surgery']),
('BMI', 'BMI', 30.00, ARRAY['consultation', 'laboratory', 'imaging', 'surgery', 'hospitalization']),
('Humana', 'HUMA', 25.00, ARRAY['consultation', 'laboratory', 'imaging']),
('Salud SA', 'SALU', 20.00, ARRAY['consultation', 'laboratory'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 5. UPDATE BILLINGS TABLE
-- ============================================================================
-- Add columns for detailed billing

DO $$ 
BEGIN
    -- Add subtotal column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'subtotal') THEN
        ALTER TABLE billings ADD COLUMN subtotal DECIMAL(10,2);
    END IF;

    -- Add tax_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'tax_amount') THEN
        ALTER TABLE billings ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add tax_percentage column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'tax_percentage') THEN
        ALTER TABLE billings ADD COLUMN tax_percentage DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Add insurance_provider_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'insurance_provider_id') THEN
        ALTER TABLE billings ADD COLUMN insurance_provider_id UUID REFERENCES insurance_providers(id);
    END IF;

    -- Add insurance_claim_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'insurance_claim_number') THEN
        ALTER TABLE billings ADD COLUMN insurance_claim_number VARCHAR(50);
    END IF;

    -- Add insurance_discount_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'insurance_discount_amount') THEN
        ALTER TABLE billings ADD COLUMN insurance_discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'notes') THEN
        ALTER TABLE billings ADD COLUMN notes TEXT;
    END IF;

    -- Add due_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'due_date') THEN
        ALTER TABLE billings ADD COLUMN due_date DATE;
    END IF;

    -- Add payment_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'payment_method') THEN
        ALTER TABLE billings ADD COLUMN payment_method VARCHAR(50);
    END IF;

    -- Add payment_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'payment_date') THEN
        ALTER TABLE billings ADD COLUMN payment_date TIMESTAMPTZ;
    END IF;

    -- Add total_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'total_amount') THEN
        ALTER TABLE billings ADD COLUMN total_amount DECIMAL(10,2);
    END IF;

    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'status') THEN
        ALTER TABLE billings ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Add invoice_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'invoice_number') THEN
        ALTER TABLE billings ADD COLUMN invoice_number VARCHAR(50);
    END IF;

    -- Add doctor_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'billings' AND column_name = 'doctor_id') THEN
        ALTER TABLE billings ADD COLUMN doctor_id UUID REFERENCES doctors(id);
    END IF;
END $$;

-- ============================================================================
-- 6. INSERT DEFAULT MEDICAL SERVICES
-- ============================================================================

INSERT INTO medical_services (name, description, category, base_price) VALUES
-- General services
('Consulta General', 'Consulta médica general', 'consultation', 50.00),
('Consulta de Seguimiento', 'Cita de control o seguimiento', 'consultation', 35.00),
('Consulta de Emergencia', 'Atención de emergencia', 'consultation', 80.00),
-- Procedures
('Curaciones', 'Curación de heridas', 'procedure', 25.00),
('Inyección Intramuscular', 'Aplicación de inyección IM', 'procedure', 10.00),
('Inyección Intravenosa', 'Aplicación de inyección IV', 'procedure', 15.00),
('Sutura Simple', 'Sutura de herida simple', 'procedure', 45.00),
('Retiro de Puntos', 'Retiro de suturas', 'procedure', 20.00),
-- Laboratory
('Hemograma Completo', 'Análisis de sangre completo', 'laboratory', 25.00),
('Glucosa en Ayunas', 'Medición de glucosa', 'laboratory', 15.00),
('Perfil Lipídico', 'Colesterol y triglicéridos', 'laboratory', 35.00),
('Examen de Orina', 'Uroanálisis completo', 'laboratory', 15.00),
-- Certificates
('Certificado Médico', 'Certificado de salud', 'certificate', 15.00),
('Certificado de Reposo', 'Certificado de incapacidad', 'certificate', 10.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. VIEW FOR BILLING SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW billing_summary AS
SELECT 
    b.id,
    b.invoice_number,
    b.appointment_id,
    b.patient_user_id,
    pu.first_name || ' ' || pu.last_name as patient_name,
    b.doctor_id,
    du.first_name || ' ' || du.last_name as doctor_name,
    s.name as specialty_name,
    b.subtotal,
    b.insurance_discount_amount,
    b.tax_amount,
    b.total_amount,
    b.status,
    b.payment_method,
    b.payment_date,
    ip.name as insurance_provider,
    ip.discount_percentage as insurance_discount_rate,
    b.created_at,
    (SELECT COUNT(*) FROM billing_items bi WHERE bi.billing_id = b.id) as item_count
FROM billings b
LEFT JOIN users pu ON b.patient_user_id = pu.id
LEFT JOIN doctors d ON b.doctor_id = d.id
LEFT JOIN users du ON d.user_id = du.id
LEFT JOIN specialties s ON d.specialty_id = s.id
LEFT JOIN insurance_providers ip ON b.insurance_provider_id = ip.id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE medical_services IS 'Catalog of medical services and procedures with prices';
COMMENT ON TABLE billing_items IS 'Individual line items in a billing/invoice';
COMMENT ON TABLE insurance_providers IS 'Registered insurance providers with discount rates';
