-- Migration: Expand phenotype_type column to accommodate 'Moderate' and 'Low' values
-- The original VARCHAR(5) can only hold 'I', 'II', 'III', 'IV' but not 'Moderate' (8 chars)

-- Expand phenotype_type in patient_gcua_assessments table
ALTER TABLE patient_gcua_assessments
ALTER COLUMN phenotype_type TYPE VARCHAR(10);

-- Expand gcua_phenotype in patient_risk_factors table
ALTER TABLE patient_risk_factors
ALTER COLUMN gcua_phenotype TYPE VARCHAR(10);

-- Verification
SELECT 'Migration complete: Expanded phenotype_type columns to VARCHAR(10)' AS status;
