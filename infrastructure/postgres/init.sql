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

-- Patient 1: High Risk - Advanced CKD with Diabetes
INSERT INTO patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'MRN001', 'John', 'Anderson', '1958-03-15', 'male', 'john.anderson@email.com', '+1-555-0101');

-- Patient 2: Medium Risk - Hypertension with declining kidney function
INSERT INTO patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'MRN002', 'Maria', 'Rodriguez', '1965-07-22', 'female', 'maria.rodriguez@email.com', '+1-555-0102');

-- Patient 3: Low Risk - Normal kidney function
INSERT INTO patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'MRN003', 'David', 'Chen', '1980-11-08', 'male', 'david.chen@email.com', '+1-555-0103');

-- Patient 4: High Risk - Multiple comorbidities
INSERT INTO patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'MRN004', 'Sarah', 'Johnson', '1952-05-30', 'female', 'sarah.johnson@email.com', '+1-555-0104');

-- Patient 5: Medium Risk - Early CKD indicators
INSERT INTO patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, email, phone)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'MRN005', 'Michael', 'Thompson', '1970-09-12', 'male', 'michael.thompson@email.com', '+1-555-0105');

-- ============================================
-- Clinical Observations - Lab Results
-- ============================================

-- Patient 1 (John Anderson) - High Risk: Advanced CKD (Stage 3b-4)
INSERT INTO observations (patient_id, observation_type, value_numeric, unit, observation_date, notes)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'eGFR', 28.5, 'mL/min/1.73m²', '2025-11-01 09:30:00', 'Stage 4 CKD'),
    ('11111111-1111-1111-1111-111111111111', 'serum_creatinine', 2.4, 'mg/dL', '2025-11-01 09:30:00', 'Elevated'),
    ('11111111-1111-1111-1111-111111111111', 'uACR', 450, 'mg/g', '2025-11-01 09:30:00', 'Severely increased albuminuria'),
    ('11111111-1111-1111-1111-111111111111', 'blood_pressure_systolic', 158, 'mmHg', '2025-11-01 10:00:00', 'Hypertensive'),
    ('11111111-1111-1111-1111-111111111111', 'blood_pressure_diastolic', 92, 'mmHg', '2025-11-01 10:00:00', 'Hypertensive'),
    ('11111111-1111-1111-1111-111111111111', 'HbA1c', 8.2, '%', '2025-11-01 09:30:00', 'Poorly controlled diabetes'),
    ('11111111-1111-1111-1111-111111111111', 'potassium', 5.3, 'mEq/L', '2025-11-01 09:30:00', 'Slightly elevated');

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
