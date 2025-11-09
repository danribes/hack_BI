-- Healthcare AI Clinical Data Analyzer - Database Initialization
-- This script runs once when the PostgreSQL container is first created
-- Creates tables and populates with 5 mock CKD patients with realistic clinical data

-- ============================================
-- Extensions and Configuration
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET timezone = 'UTC';

-- ============================================
-- Schema Creation
-- ============================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    -- Enhanced fields for comprehensive patient data
    weight DECIMAL(5, 2),
    height INTEGER,
    smoking_status VARCHAR(20),
    cvd_history BOOLEAN DEFAULT false,
    family_history_esrd BOOLEAN DEFAULT false,
    on_ras_inhibitor BOOLEAN DEFAULT false,
    on_sglt2i BOOLEAN DEFAULT false,
    nephrotoxic_meds BOOLEAN DEFAULT false,
    nephrologist_referral BOOLEAN DEFAULT false,
    diagnosis_date DATE,
    last_visit_date DATE,
    next_visit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical observations (lab results)
CREATE TABLE IF NOT EXISTS observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    observation_type VARCHAR(50) NOT NULL, -- 'eGFR', 'creatinine', 'uACR', 'blood_pressure', etc.
    value_numeric DECIMAL(10, 2),
    value_text VARCHAR(100),
    unit VARCHAR(20),
    observation_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'final', -- 'preliminary', 'final', 'amended'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinical conditions (diagnoses)
CREATE TABLE IF NOT EXISTS conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    condition_code VARCHAR(20) NOT NULL, -- ICD-10 code
    condition_name VARCHAR(200) NOT NULL,
    clinical_status VARCHAR(20) NOT NULL, -- 'active', 'resolved', 'inactive'
    onset_date DATE,
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20), -- 'mild', 'moderate', 'severe'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk assessments (AI-generated)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    risk_score DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    recommendations TEXT[],
    reasoning TEXT,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_observations_patient_id ON observations(patient_id);
CREATE INDEX idx_observations_type ON observations(observation_type);
CREATE INDEX idx_observations_date ON observations(observation_date);
CREATE INDEX idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX idx_conditions_status ON conditions(clinical_status);
CREATE INDEX idx_risk_assessments_patient_id ON risk_assessments(patient_id);

-- ============================================
-- Mock Patient Data - 5 CKD Patients
-- ============================================

-- Patient 1: High Risk - Advanced CKD with Diabetes (Stage 4)
INSERT INTO patients (
    id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone,
    weight, height, smoking_status, cvd_history, family_history_esrd,
    on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
    diagnosis_date, last_visit_date, next_visit_date
)
VALUES (
    '11111111-1111-1111-1111-111111111111', 'MRN001', 'John', 'Anderson', '1958-03-15', 'male',
    'john.anderson@email.com', '+1-555-0101',
    92.5, 172, 'Former', true, false,
    true, false, true, false,
    '2022-05-20', '2025-10-15', '2025-11-28'
);

-- Patient 2: Medium Risk - Hypertension with declining kidney function (Stage 3a)
INSERT INTO patients (
    id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone,
    weight, height, smoking_status, cvd_history, family_history_esrd,
    on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
    diagnosis_date, last_visit_date, next_visit_date
)
VALUES (
    '22222222-2222-2222-2222-222222222222', 'MRN002', 'Maria', 'Rodriguez', '1965-07-22', 'female',
    'maria.rodriguez@email.com', '+1-555-0102',
    82.0, 162, 'Never', false, false,
    true, false, false, false,
    '2023-08-10', '2025-10-28', '2026-04-28'
);

-- Patient 3: Low Risk - Normal kidney function (No CKD)
INSERT INTO patients (
    id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone,
    weight, height, smoking_status, cvd_history, family_history_esrd,
    on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
    diagnosis_date, last_visit_date, next_visit_date
)
VALUES (
    '33333333-3333-3333-3333-333333333333', 'MRN003', 'David', 'Chen', '1980-11-08', 'male',
    'david.chen@email.com', '+1-555-0103',
    75.0, 178, 'Never', false, false,
    false, false, false, false,
    NULL, '2025-11-03', '2026-05-03'
);

-- Patient 4: High Risk - Multiple comorbidities (Stage 3b)
INSERT INTO patients (
    id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone,
    weight, height, smoking_status, cvd_history, family_history_esrd,
    on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
    diagnosis_date, last_visit_date, next_visit_date
)
VALUES (
    '44444444-4444-4444-4444-444444444444', 'MRN004', 'Sarah', 'Johnson', '1952-05-30', 'female',
    'sarah.johnson@email.com', '+1-555-0104',
    78.5, 160, 'Current', true, true,
    true, true, false, true,
    '2021-03-15', '2025-10-30', '2025-12-15'
);

-- Patient 5: Medium Risk - Early CKD indicators (Stage 2)
INSERT INTO patients (
    id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone,
    weight, height, smoking_status, cvd_history, family_history_esrd,
    on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
    diagnosis_date, last_visit_date, next_visit_date
)
VALUES (
    '55555555-5555-5555-5555-555555555555', 'MRN005', 'Michael', 'Thompson', '1970-09-12', 'male',
    'michael.thompson@email.com', '+1-555-0105',
    95.0, 180, 'Former', false, false,
    true, false, false, false,
    '2024-01-20', '2025-10-25', '2026-01-25'
);

-- ============================================
-- Clinical Observations - Lab Results
-- ============================================

-- Patient 1 (John Anderson) - High Risk: Advanced CKD (Stage 4)
INSERT INTO observations (patient_id, observation_type, value_numeric, value_text, unit, observation_date, notes)
VALUES
    -- Kidney Function
    ('11111111-1111-1111-1111-111111111111', 'eGFR', 28.5, NULL, 'mL/min/1.73m²', '2025-11-01 09:30:00', 'Stage 4 CKD'),
    ('11111111-1111-1111-1111-111111111111', 'eGFR_trend', NULL, 'down', NULL, '2025-11-01 09:30:00', 'Declining kidney function'),
    ('11111111-1111-1111-1111-111111111111', 'eGFR_change_percent', -8.5, NULL, '%', '2025-11-01 09:30:00', '8.5% decline from last measurement'),
    ('11111111-1111-1111-1111-111111111111', 'serum_creatinine', 2.4, NULL, 'mg/dL', '2025-11-01 09:30:00', 'Elevated'),
    ('11111111-1111-1111-1111-111111111111', 'BUN', 45, NULL, 'mg/dL', '2025-11-01 09:30:00', 'Elevated'),
    ('11111111-1111-1111-1111-111111111111', 'uACR', 450, NULL, 'mg/g', '2025-11-01 09:30:00', 'Severely increased albuminuria'),
    ('11111111-1111-1111-1111-111111111111', 'proteinuria_category', NULL, 'A3', NULL, '2025-11-01 09:30:00', 'Severely increased albuminuria (>300 mg/g)'),
    -- Cardiovascular & Blood Pressure
    ('11111111-1111-1111-1111-111111111111', 'blood_pressure_systolic', 152, NULL, 'mmHg', '2025-11-01 10:00:00', 'Hypertensive'),
    ('11111111-1111-1111-1111-111111111111', 'blood_pressure_diastolic', 94, NULL, 'mmHg', '2025-11-01 10:00:00', 'Hypertensive'),
    -- Metabolic
    ('11111111-1111-1111-1111-111111111111', 'HbA1c', 7.8, NULL, '%', '2025-11-01 09:30:00', 'Suboptimal diabetes control'),
    ('11111111-1111-1111-1111-111111111111', 'LDL_cholesterol', 142, NULL, 'mg/dL', '2025-11-01 09:30:00', 'Above target'),
    ('11111111-1111-1111-1111-111111111111', 'HDL_cholesterol', 38, NULL, 'mg/dL', '2025-11-01 09:30:00', 'Low'),
    -- Hematology & Minerals
    ('11111111-1111-1111-1111-111111111111', 'hemoglobin', 10.2, NULL, 'g/dL', '2025-11-01 09:30:00', 'Anemia - CKD related'),
    ('11111111-1111-1111-1111-111111111111', 'potassium', 5.8, NULL, 'mEq/L', '2025-11-01 09:30:00', 'Hyperkalemia'),
    ('11111111-1111-1111-1111-111111111111', 'calcium', 8.9, NULL, 'mg/dL', '2025-11-01 09:30:00', 'Low normal'),
    ('11111111-1111-1111-1111-111111111111', 'phosphorus', 5.2, NULL, 'mg/dL', '2025-11-01 09:30:00', 'Elevated - CKD'),
    ('11111111-1111-1111-1111-111111111111', 'albumin', 3.2, NULL, 'g/dL', '2025-11-01 09:30:00', 'Low normal');

-- Patient 2 (Maria Rodriguez) - Medium Risk: Stage 2-3a CKD with HTN
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, notes)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'eGFR', 52.3, 'mL/min/1.73m²', '2025-10-28 08:15:00', 'Mild-moderate decline'),
    ('22222222-2222-2222-2222-222222222222', 'serum_creatinine', 1.3, 'mg/dL', '2025-10-28 08:15:00', 'Slightly elevated'),
    ('22222222-2222-2222-2222-222222222222', 'uACR', 85, 'mg/g', '2025-10-28 08:15:00', 'Moderately increased albuminuria'),
    ('22222222-2222-2222-2222-222222222222', 'blood_pressure_systolic', 148, 'mmHg', '2025-10-28 09:00:00', 'Stage 2 hypertension'),
    ('22222222-2222-2222-2222-222222222222', 'blood_pressure_diastolic', 88, 'mmHg', '2025-10-28 09:00:00', 'Elevated'),
    ('22222222-2222-2222-2222-222222222222', 'BMI', 32.4, 'kg/m²', '2025-10-28 09:00:00', 'Obese');

-- Patient 3 (David Chen) - Low Risk: Normal kidney function
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, notes)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'eGFR', 95.2, 'mL/min/1.73m²', '2025-11-03 10:45:00', 'Normal'),
    ('33333333-3333-3333-3333-333333333333', 'serum_creatinine', 0.9, 'mg/dL', '2025-11-03 10:45:00', 'Normal'),
    ('33333333-3333-3333-3333-333333333333', 'uACR', 12, 'mg/g', '2025-11-03 10:45:00', 'Normal'),
    ('33333333-3333-3333-3333-333333333333', 'blood_pressure_systolic', 118, 'mmHg', '2025-11-03 11:00:00', 'Normal'),
    ('33333333-3333-3333-3333-333333333333', 'blood_pressure_diastolic', 76, 'mmHg', '2025-11-03 11:00:00', 'Normal'),
    ('33333333-3333-3333-3333-333333333333', 'BMI', 24.1, 'kg/m²', '2025-11-03 11:00:00', 'Normal weight');

-- Patient 4 (Sarah Johnson) - High Risk: Multiple comorbidities, Stage 3b CKD
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, notes)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'eGFR', 38.7, 'mL/min/1.73m²', '2025-10-30 07:30:00', 'Stage 3b CKD'),
    ('44444444-4444-4444-4444-444444444444', 'serum_creatinine', 1.8, 'mg/dL', '2025-10-30 07:30:00', 'Elevated'),
    ('44444444-4444-4444-4444-444444444444', 'uACR', 320, 'mg/g', '2025-10-30 07:30:00', 'Severely increased albuminuria'),
    ('44444444-4444-4444-4444-444444444444', 'blood_pressure_systolic', 165, 'mmHg', '2025-10-30 08:00:00', 'Stage 2 hypertension'),
    ('44444444-4444-4444-4444-444444444444', 'blood_pressure_diastolic', 95, 'mmHg', '2025-10-30 08:00:00', 'Hypertensive'),
    ('44444444-4444-4444-4444-444444444444', 'HbA1c', 7.8, '%', '2025-10-30 07:30:00', 'Suboptimal diabetes control'),
    ('44444444-4444-4444-4444-444444444444', 'LDL_cholesterol', 145, 'mg/dL', '2025-10-30 07:30:00', 'Above target'),
    ('44444444-4444-4444-4444-444444444444', 'BMI', 34.8, 'kg/m²', '2025-10-30 08:00:00', 'Obese class I');

-- Patient 5 (Michael Thompson) - Medium Risk: Early CKD Stage 2
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, notes)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'eGFR', 68.5, 'mL/min/1.73m²', '2025-11-02 09:00:00', 'Mild decline'),
    ('55555555-5555-5555-5555-555555555555', 'serum_creatinine', 1.2, 'mg/dL', '2025-11-02 09:00:00', 'Upper normal'),
    ('55555555-5555-5555-5555-555555555555', 'uACR', 42, 'mg/g', '2025-11-02 09:00:00', 'Mildly increased albuminuria'),
    ('55555555-5555-5555-5555-555555555555', 'blood_pressure_systolic', 138, 'mmHg', '2025-11-02 09:30:00', 'Prehypertension'),
    ('55555555-5555-5555-5555-555555555555', 'blood_pressure_diastolic', 84, 'mmHg', '2025-11-02 09:30:00', 'Borderline'),
    ('55555555-5555-5555-5555-555555555555', 'BMI', 28.5, 'kg/m²', '2025-11-02 09:30:00', 'Overweight');

-- ============================================
-- Clinical Conditions - Diagnoses
-- ============================================

-- Patient 1 (John Anderson) - Type 2 Diabetes, CKD Stage 4, Hypertension
INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity, notes)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'E11.9', 'Type 2 Diabetes Mellitus', 'active', '2005-06-15', 'moderate', 'Long-standing, on insulin'),
    ('11111111-1111-1111-1111-111111111111', 'N18.4', 'Chronic Kidney Disease, Stage 4', 'active', '2020-03-20', 'severe', 'eGFR 15-29, nephrology follow-up'),
    ('11111111-1111-1111-1111-111111111111', 'I10', 'Essential Hypertension', 'active', '2008-09-10', 'moderate', 'On multiple antihypertensives'),
    ('11111111-1111-1111-1111-111111111111', 'E78.5', 'Hyperlipidemia', 'active', '2010-01-05', 'mild', 'On statin therapy');

-- Patient 2 (Maria Rodriguez) - Hypertension, CKD Stage 3a
INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity, notes)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'I10', 'Essential Hypertension', 'active', '2015-04-12', 'moderate', 'On ACE inhibitor'),
    ('22222222-2222-2222-2222-222222222222', 'N18.3', 'Chronic Kidney Disease, Stage 3a', 'active', '2022-08-15', 'mild', 'eGFR 45-59, monitoring'),
    ('22222222-2222-2222-2222-222222222222', 'E66.9', 'Obesity', 'active', '2012-02-20', 'moderate', 'BMI >30');

-- Patient 3 (David Chen) - No significant chronic conditions
INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity, notes)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'Z00.00', 'Encounter for general adult medical examination', 'active', '2025-11-03', 'none', 'Annual physical, all normal');

-- Patient 4 (Sarah Johnson) - Multiple comorbidities
INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity, notes)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'E11.9', 'Type 2 Diabetes Mellitus', 'active', '2000-03-10', 'moderate', 'Long duration, multiple complications'),
    ('44444444-4444-4444-4444-444444444444', 'N18.3', 'Chronic Kidney Disease, Stage 3b', 'active', '2018-11-22', 'moderate', 'eGFR 30-44, diabetic nephropathy'),
    ('44444444-4444-4444-4444-444444444444', 'I10', 'Essential Hypertension', 'active', '2002-07-15', 'severe', 'Difficult to control'),
    ('44444444-4444-4444-4444-444444444444', 'I25.10', 'Coronary Artery Disease', 'active', '2016-05-20', 'moderate', 'Post-MI, on dual antiplatelet'),
    ('44444444-4444-4444-4444-444444444444', 'E78.5', 'Hyperlipidemia', 'active', '2005-01-08', 'moderate', 'On high-intensity statin'),
    ('44444444-4444-4444-4444-444444444444', 'E66.9', 'Obesity', 'active', '1995-01-01', 'moderate', 'BMI >30');

-- Patient 5 (Michael Thompson) - Prehypertension, Early CKD
INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, severity, notes)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'R03.0', 'Elevated blood pressure reading', 'active', '2024-06-10', 'mild', 'Prehypertensive, lifestyle modifications'),
    ('55555555-5555-5555-5555-555555555555', 'N18.2', 'Chronic Kidney Disease, Stage 2', 'active', '2024-09-15', 'mild', 'eGFR 60-89 with kidney damage, monitoring'),
    ('55555555-5555-5555-5555-555555555555', 'E66.9', 'Overweight', 'active', '2020-01-01', 'mild', 'BMI 25-30, diet counseling');

-- ============================================
-- Summary Statistics
-- ============================================

-- Create a view for easy patient summary
CREATE OR REPLACE VIEW patient_summary AS
SELECT
    p.id,
    p.medical_record_number,
    p.first_name || ' ' || p.last_name AS full_name,
    EXTRACT(YEAR FROM AGE(p.date_of_birth)) AS age,
    p.gender,
    COUNT(DISTINCT o.id) AS observation_count,
    COUNT(DISTINCT c.id) AS condition_count,
    MAX(CASE WHEN o.observation_type = 'eGFR' THEN o.value_numeric END) AS latest_egfr
FROM patients p
LEFT JOIN observations o ON p.id = o.patient_id
LEFT JOIN conditions c ON p.id = c.patient_id AND c.clinical_status = 'active'
GROUP BY p.id, p.medical_record_number, p.first_name, p.last_name, p.date_of_birth, p.gender;

-- ============================================
-- Verification
-- ============================================

-- Verify data was inserted
SELECT 'Database initialization complete' AS status;
SELECT 'Total patients: ' || COUNT(*) FROM patients;
SELECT 'Total observations: ' || COUNT(*) FROM observations;
SELECT 'Total conditions: ' || COUNT(*) FROM conditions;

-- Display patient summary
SELECT * FROM patient_summary ORDER BY medical_record_number;
-- ================================================================
-- Generate 200 Mock Patient Records with Comprehensive Clinical Data
-- ================================================================
-- This script generates diverse patient demographics, observations,
-- and conditions representing various CKD stages and risk levels

-- Function to generate random UUID v4
CREATE OR REPLACE FUNCTION random_uuid() RETURNS uuid AS $$
BEGIN
  RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Insert 200 mock patients with diverse demographics
DO $$
DECLARE
  v_patient_id uuid;
  v_age integer;
  v_gender text;
  v_has_diabetes boolean;
  v_has_hypertension boolean;
  v_has_cvd boolean;
  v_weight decimal;
  v_height integer;
  v_bmi decimal;
  v_egfr decimal;
  v_uacr decimal;
  v_creatinine decimal;
  v_smoking text;
  v_ckd_stage integer;
  v_diagnosis_years integer;
  v_first_name text;
  v_last_name text;
  v_risk_level integer;

  -- Name arrays for random generation
  first_names_male text[] := ARRAY['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Alexander', 'Frank', 'Patrick', 'Raymond', 'Jack', 'Dennis', 'Jerry'];
  first_names_female text[] := ARRAY['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather'];
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

BEGIN
  -- Generate 200 patients
  FOR i IN 1..200 LOOP
    v_patient_id := random_uuid();

    -- Random demographics
    v_gender := CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END;
    v_age := 40 + floor(random() * 46)::integer; -- Ages 40-85
    v_height := CASE
      WHEN v_gender = 'male' THEN 165 + floor(random() * 25)::integer
      ELSE 155 + floor(random() * 25)::integer
    END;
    v_weight := 55 + (random() * 60); -- 55-115 kg
    v_bmi := v_weight / ((v_height / 100.0) * (v_height / 100.0));

    -- Generate name
    v_first_name := CASE
      WHEN v_gender = 'male' THEN first_names_male[1 + floor(random() * array_length(first_names_male, 1))::integer]
      ELSE first_names_female[1 + floor(random() * array_length(first_names_female, 1))::integer]
    END;
    v_last_name := last_names[1 + floor(random() * array_length(last_names, 1))::integer];

    -- Risk factor distribution (realistic prevalence)
    v_has_diabetes := random() < 0.30; -- 30% have diabetes
    v_has_hypertension := random() < 0.45; -- 45% have hypertension
    v_has_cvd := random() < 0.20; -- 20% have CVD history

    -- Smoking status
    v_smoking := CASE
      WHEN random() < 0.50 THEN 'Never'
      WHEN random() < 0.70 THEN 'Former'
      ELSE 'Current'
    END;

    -- Determine risk level and adjust labs accordingly
    -- Tier 1: ~40% - Low risk (normal labs, no/few risk factors)
    -- Tier 2: ~35% - Moderate risk (one risk factor, borderline labs)
    -- Tier 3: ~25% - High risk (multiple risk factors or abnormal labs)

    IF random() < 0.40 THEN
      -- Tier 1: Low risk
      v_risk_level := 1;
      v_egfr := 75 + (random() * 30); -- eGFR 75-105
      v_uacr := random() * 25; -- uACR 0-25
      v_creatinine := 0.8 + (random() * 0.4); -- Creatinine 0.8-1.2
      v_ckd_stage := 0; -- No CKD or Stage 1
    ELSIF random() < 0.75 THEN
      -- Tier 2: Moderate risk
      v_risk_level := 2;
      v_egfr := 50 + (random() * 35); -- eGFR 50-85
      v_uacr := 25 + (random() * 75); -- uACR 25-100
      v_creatinine := 1.0 + (random() * 0.8); -- Creatinine 1.0-1.8
      v_ckd_stage := CASE
        WHEN v_egfr >= 60 THEN 2
        WHEN v_egfr >= 45 THEN 3
        ELSE 3
      END;
    ELSE
      -- Tier 3: High risk
      v_risk_level := 3;
      v_egfr := 15 + (random() * 45); -- eGFR 15-60
      v_uacr := 100 + (random() * 400); -- uACR 100-500
      v_creatinine := 1.5 + (random() * 2.5); -- Creatinine 1.5-4.0
      v_ckd_stage := CASE
        WHEN v_egfr >= 45 THEN 3
        WHEN v_egfr >= 30 THEN 3
        WHEN v_egfr >= 15 THEN 4
        ELSE 5
      END;
      -- High risk patients more likely to have risk factors
      v_has_diabetes := v_has_diabetes OR random() < 0.5;
      v_has_hypertension := v_has_hypertension OR random() < 0.6;
    END IF;

    v_diagnosis_years := CASE
      WHEN v_ckd_stage >= 3 THEN floor(random() * 8)::integer
      WHEN v_ckd_stage = 2 THEN floor(random() * 5)::integer
      ELSE 0
    END;

    -- Insert patient
    INSERT INTO patients (
      id, medical_record_number, first_name, last_name,
      date_of_birth, gender, email, phone,
      weight, height, smoking_status, cvd_history, family_history_esrd,
      on_ras_inhibitor, on_sglt2i, nephrotoxic_meds, nephrologist_referral,
      diagnosis_date, last_visit_date, next_visit_date
    ) VALUES (
      v_patient_id,
      'MRN' || lpad((i + 100)::text, 5, '0'),
      v_first_name,
      v_last_name,
      (CURRENT_DATE - (v_age * 365 + floor(random() * 365)::integer))::date,
      v_gender,
      lower(v_first_name) || '.' || lower(v_last_name) || '@email.com',
      '+1-555-' || lpad(floor(random() * 10000)::text, 4, '0'),
      v_weight,
      v_height,
      v_smoking,
      v_has_cvd,
      random() < 0.10, -- 10% family history of ESRD
      v_has_diabetes OR v_has_hypertension, -- RAS inhibitor if DM or HTN
      v_has_diabetes AND random() < 0.30, -- 30% of diabetics on SGLT2i
      random() < 0.15, -- 15% on nephrotoxic meds
      v_ckd_stage >= 4 AND random() < 0.70, -- 70% of stage 4+ have nephro referral
      CASE WHEN v_diagnosis_years > 0 THEN (CURRENT_DATE - (v_diagnosis_years * 365))::date ELSE NULL END,
      (CURRENT_DATE - floor(random() * 90)::integer)::date, -- Last visit 0-90 days ago
      (CURRENT_DATE + (30 + floor(random() * 120)::integer))::date -- Next visit 30-150 days from now
    );

    -- Insert comprehensive observations
    -- Kidney Function Panel
    INSERT INTO observations (patient_id, observation_type, value_numeric, value_text, unit, observation_date, status, notes) VALUES
      (v_patient_id, 'eGFR', v_egfr, NULL, 'mL/min/1.73m²', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE
          WHEN v_egfr < 15 THEN 'Stage 5 CKD - Kidney failure'
          WHEN v_egfr < 30 THEN 'Stage 4 CKD - Severe decrease'
          WHEN v_egfr < 45 THEN 'Stage 3b CKD'
          WHEN v_egfr < 60 THEN 'Stage 3a CKD'
          WHEN v_egfr < 90 THEN 'Stage 2 CKD - Mild decrease'
          ELSE 'Normal kidney function'
        END),
      (v_patient_id, 'eGFR_trend', NULL,
        CASE
          WHEN v_risk_level = 3 AND random() < 0.6 THEN 'down'
          WHEN v_risk_level = 1 THEN 'stable'
          ELSE CASE WHEN random() < 0.7 THEN 'stable' ELSE 'down' END
        END,
        NULL, CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'eGFR_change_percent',
        CASE
          WHEN v_risk_level = 3 THEN -(3 + random() * 12) -- High risk: -3% to -15%
          WHEN v_risk_level = 2 THEN -(random() * 5) -- Moderate risk: 0% to -5%
          ELSE (random() * 4 - 2) -- Low risk: -2% to +2%
        END,
        NULL, '%', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'serum_creatinine', v_creatinine, NULL, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE WHEN v_creatinine > 1.5 THEN 'Elevated' ELSE 'Normal' END),
      (v_patient_id, 'BUN', 10 + (v_creatinine - 0.8) * 25 + random() * 10, NULL, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'uACR', v_uacr, NULL, 'mg/g', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE
          WHEN v_uacr >= 300 THEN 'Severely increased albuminuria (A3)'
          WHEN v_uacr >= 30 THEN 'Moderately increased albuminuria (A2)'
          ELSE 'Normal albuminuria (A1)'
        END),
      (v_patient_id, 'proteinuria_category', NULL,
        CASE WHEN v_uacr >= 300 THEN 'A3' WHEN v_uacr >= 30 THEN 'A2' ELSE 'A1' END,
        NULL, CURRENT_TIMESTAMP - interval '1 day', 'final', NULL);

    -- Hematology & Minerals
    INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status, notes) VALUES
      (v_patient_id, 'hemoglobin',
        CASE
          WHEN v_ckd_stage >= 4 THEN 9 + random() * 3 -- Stage 4+: 9-12 (anemia common)
          WHEN v_ckd_stage = 3 THEN 11 + random() * 3 -- Stage 3: 11-14
          ELSE 12 + random() * 4 -- Normal: 12-16
        END,
        'g/dL', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE WHEN v_ckd_stage >= 4 THEN 'CKD-related anemia' ELSE NULL END),
      (v_patient_id, 'potassium',
        CASE
          WHEN v_ckd_stage >= 4 THEN 4.5 + random() * 1.5 -- Stage 4+: 4.5-6.0 (hyperkalemia risk)
          ELSE 3.5 + random() * 1.2 -- Normal: 3.5-4.7
        END,
        'mEq/L', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE WHEN v_ckd_stage >= 4 AND random() < 0.4 THEN 'Hyperkalemia risk' ELSE NULL END),
      (v_patient_id, 'calcium', 8.5 + random() * 1.5, 'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'phosphorus',
        CASE
          WHEN v_ckd_stage >= 4 THEN 4.5 + random() * 2 -- Elevated in advanced CKD
          ELSE 2.5 + random() * 2
        END,
        'mg/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'albumin', 3.0 + random() * 1.5, 'g/dL', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL);

    -- Metabolic & Cardiovascular Panel
    INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, status, notes) VALUES
      (v_patient_id, 'HbA1c',
        CASE
          WHEN v_has_diabetes THEN 6.5 + random() * 2.5 -- Diabetics: 6.5-9.0%
          ELSE 4.5 + random() * 1.0 -- Non-diabetics: 4.5-5.5%
        END,
        '%', CURRENT_TIMESTAMP - interval '30 days', 'final',
        CASE WHEN v_has_diabetes AND random() < 0.3 THEN 'Suboptimal control' ELSE NULL END),
      (v_patient_id, 'blood_pressure_systolic',
        CASE
          WHEN v_has_hypertension THEN 130 + random() * 30 -- HTN: 130-160
          ELSE 110 + random() * 20 -- Normal: 110-130
        END,
        'mmHg', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'blood_pressure_diastolic',
        CASE
          WHEN v_has_hypertension THEN 85 + random() * 15 -- HTN: 85-100
          ELSE 70 + random() * 15 -- Normal: 70-85
        END,
        'mmHg', CURRENT_TIMESTAMP - interval '1 day', 'final', NULL),
      (v_patient_id, 'LDL_cholesterol', 80 + random() * 100, 'mg/dL', CURRENT_TIMESTAMP - interval '60 days', 'final', NULL),
      (v_patient_id, 'HDL_cholesterol', 30 + random() * 40, 'mg/dL', CURRENT_TIMESTAMP - interval '60 days', 'final', NULL),
      (v_patient_id, 'BMI', v_bmi, 'kg/m²', CURRENT_TIMESTAMP - interval '1 day', 'final',
        CASE
          WHEN v_bmi >= 30 THEN 'Obese'
          WHEN v_bmi >= 25 THEN 'Overweight'
          ELSE 'Normal weight'
        END);

    -- Insert conditions
    IF v_has_diabetes THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'E11.9', 'Type 2 Diabetes Mellitus', 'active',
        (CURRENT_DATE - (floor(random() * 3650) + 365))::date, CURRENT_TIMESTAMP,
        CASE WHEN random() < 0.3 THEN 'severe' WHEN random() < 0.6 THEN 'moderate' ELSE 'mild' END);
    END IF;

    IF v_has_hypertension THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'I10', 'Essential Hypertension', 'active',
        (CURRENT_DATE - (floor(random() * 3650) + 365))::date, CURRENT_TIMESTAMP,
        CASE WHEN random() < 0.2 THEN 'severe' WHEN random() < 0.5 THEN 'moderate' ELSE 'mild' END);
    END IF;

    IF v_has_cvd THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'I25.10', 'Coronary Artery Disease', 'active',
        (CURRENT_DATE - (floor(random() * 2920) + 730))::date, CURRENT_TIMESTAMP, 'moderate');
    END IF;

    IF v_ckd_stage >= 2 THEN
      INSERT INTO conditions (patient_id, condition_code, condition_name, clinical_status, onset_date, recorded_date, severity)
      VALUES (v_patient_id, 'N18.' || v_ckd_stage::text,
        'Chronic Kidney Disease, Stage ' || v_ckd_stage::text,
        'active',
        CASE WHEN v_diagnosis_years > 0 THEN (CURRENT_DATE - (v_diagnosis_years * 365))::date ELSE CURRENT_DATE END,
        CURRENT_TIMESTAMP,
        CASE
          WHEN v_ckd_stage >= 4 THEN 'severe'
          WHEN v_ckd_stage = 3 THEN 'moderate'
          ELSE 'mild'
        END);
    END IF;

  END LOOP;

  RAISE NOTICE 'Successfully generated 200 mock patients with comprehensive clinical data';
END $$;

-- Clean up function
DROP FUNCTION IF EXISTS random_uuid();
