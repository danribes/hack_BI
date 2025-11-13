# Fallback Screening System - Documentation

## Overview

The **Fallback Screening System** enables robust CKD risk stratification even when primary lab markers (eGFR, uACR, HbA1c) are missing. The system uses a **3-tier conditional funnel** that progressively narrows the patient population based on available data.

## Problem Solved

**Challenge**: What happens when a patient has risk factors (diabetes, hypertension, age >60) but no recent lab results?

**Traditional Approach**: ❌ Cannot assess risk → no action taken

**Fallback System**: ✅ Identifies patient as "at-risk" based on comorbidities → flags for screening → generates specific lab order recommendations

---

## Architecture: The 3-Tier Funnel

### Tier 1: Population Triage
**Goal**: Identify all patients who need CKD screening

**Input Data Used**:
- Diagnoses (Diabetes, Hypertension, Heart Failure, CAD)
- Demographics (Age >60)
- Comorbidities (Obesity, CVD History, Family History of ESRD)
- Medications (as proxies when diagnoses missing)

**Logic**:
```sql
IF patient has ANY of:
   • Diabetes (has_diabetes = true)
   • Hypertension (has_hypertension = true)
   • Age > 60
   • Heart Failure
   • Coronary Artery Disease
   • Obesity (BMI >= 30)
   • CVD History
   • Family History of ESRD
THEN
   → Proceed to Tier 2 (at-risk cohort)
ELSE
   → Mark as Low Risk (no further screening needed)
```

**View**: `v_tier1_at_risk_population`

---

### Tier 2: Lab Data Completeness Analysis
**Goal**: Determine if patient has recent lab results

**Input Data Used**:
- Lab results from last 12 months (eGFR, uACR, HbA1c)
- Blood pressure readings from last 6 months

**Logic**:
```sql
FOR EACH patient from Tier 1:
   IF (eGFR OR uACR is missing from last 12 months) THEN
      → Go to Tier 3 Branch A (Screening Needed)

   IF (has_diabetes AND HbA1c is missing from last 12 months) THEN
      → Go to Tier 3 Branch A (Control Unknown)

   IF (all required labs present) THEN
      → Go to Tier 3 Branch B (Analyze Labs)
```

**View**: `v_tier2_lab_analysis`

---

### Tier 3: Final Risk Classification

#### Branch A: Missing Data Path
**Scenario**: Patient has risk factors but missing labs

**Output**:
- **Risk Level**: HIGH
- **Risk Status**: "Screening Needed"
- **AI Flag**: ⚠️ "Risk assessment incomplete - missing required labs"
- **AI Recommendation**: "Order baseline eGFR and uACR tests. Recommend fasting morning draw for optimal accuracy."
- **Next Action**: Within 2 weeks

#### Branch B: Lab Analysis Path
**Scenario**: Patient has complete recent labs

**Output** (if labs abnormal):
- **Risk Level**: HIGH
- **Risk Status**: "Abnormal Results Detected"
- **AI Flag**: 🔴 "Abnormal results detected - requires follow-up"
- **AI Recommendation**: "eGFR < 60 detected (current: 45). Activate 3-month confirmation tracker. Review medication list for nephrotoxins."
- **Next Action**: 3 months (confirmation)

**Output** (if labs normal):
- **Risk Level**: MEDIUM
- **Risk Status**: "Risk Factors Present, Labs Normal"
- **AI Flag**: 🟡 "Risk factors present but labs are normal - continue monitoring"
- **AI Recommendation**: "Re-screen in 12 months. Continue monitoring blood pressure and blood glucose control."
- **Next Action**: 12 months

**View**: `v_tier3_risk_classification`

---

## Database Schema Additions

### 1. General Medications Table (`patient_medications`)

Tracks ALL medications (not just SGLT2i):

```sql
CREATE TABLE patient_medications (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES patients(id),
    medication_name VARCHAR(200),
    medication_class VARCHAR(100),  -- 'ACE Inhibitor', 'Metformin', etc.
    dosage VARCHAR(100),
    is_active BOOLEAN,
    start_date DATE,
    end_date DATE,

    -- Clinical flags for risk assessment
    is_nephrotoxic BOOLEAN,
    is_diabetes_medication BOOLEAN,
    is_hypertension_medication BOOLEAN,
    is_ras_inhibitor BOOLEAN,
    is_sglt2i BOOLEAN
);
```

**Purpose**: When labs are missing, medications serve as proxies:
- Metformin/Insulin → infers Diabetes
- Lisinopril/Amlodipine → infers Hypertension
- NSAIDs → flags nephrotoxic risk

### 2. Obesity Flag (`patients.has_obesity`)

Auto-computed from BMI:

```sql
ALTER TABLE patients ADD COLUMN has_obesity BOOLEAN;

-- Trigger automatically computes: BMI >= 30 → has_obesity = true
```

### 3. Medication-Inferred Diagnoses View

```sql
CREATE VIEW v_medication_inferred_diagnoses AS
SELECT
    patient_id,
    medication_suggests_diabetes,      -- TRUE if on Metformin/Insulin
    medication_suggests_hypertension,  -- TRUE if on BP medications
    active_medications,
    nephrotoxic_med_count
FROM patient_medications
GROUP BY patient_id;
```

---

## How the Doctor Assistant Agent Uses This

### Example 1: Patient with Diabetes but No Recent Labs

```sql
-- Query the screening status
SELECT * FROM get_patient_screening_status('patient-uuid-here');

-- Returns:
risk_level: 'HIGH'
risk_status: 'Screening Needed'
ai_flag: '⚠️ Risk assessment incomplete - missing required labs'
ai_recommendation: 'Order baseline eGFR, uACR tests. Patient has diabetes - also order HbA1c.'
missing_labs: ['eGFR', 'uACR', 'HbA1c']
next_action_date: '2024-01-29'  -- 2 weeks from today
risk_factor_count: 3
```

**Doctor Agent Response**:
> "This patient has diabetes but is missing baseline kidney function tests. I recommend ordering:
> - eGFR (estimated glomerular filtration rate)
> - uACR (urine albumin-to-creatinine ratio)
> - HbA1c (glycemic control assessment)
>
> These should be done within the next 2 weeks. A fasting morning draw is optimal for accuracy. Given the diabetes diagnosis, regular kidney monitoring is essential per KDIGO guidelines."

### Example 2: Patient on Metformin (No Diagnosis Code)

```sql
-- Check medication-inferred diagnoses
SELECT * FROM v_medication_inferred_diagnoses WHERE patient_id = 'patient-uuid';

-- Returns:
medication_suggests_diabetes: true
medication_suggests_hypertension: false
active_medications: ['Metformin 1000mg', 'Atorvastatin 20mg']
```

**Doctor Agent Logic**:
> Patient is on Metformin → likely has Diabetes → proceed to Tier 2 screening workflow → check for eGFR/uACR

### Example 3: High-Priority Dashboard for Doctors

```sql
-- Get all patients needing immediate action
SELECT
    medical_record_number,
    first_name,
    last_name,
    risk_level,
    ai_flag,
    missing_labs,
    next_action_date,
    priority_score
FROM v_patients_requiring_action
WHERE action_category = 'ORDER_LABS'
LIMIT 20;
```

**Returns**:
```
MRN       | Name          | Risk  | Missing Labs        | Next Action | Priority
----------|---------------|-------|---------------------|-------------|----------
MRN12345  | John Smith    | HIGH  | [eGFR, uACR, HbA1c] | 2024-01-29  | 180
MRN67890  | Jane Doe      | HIGH  | [eGFR, uACR]        | 2024-02-05  | 150
```

---

## API Integration Examples

### For Doctor Assistant Agent

```typescript
// backend/src/services/doctorAgent.ts

async getScreeningRecommendations(patientId: string) {
  const query = `
    SELECT
      risk_level,
      risk_status,
      ai_flag,
      ai_recommendation,
      missing_labs,
      next_action_date
    FROM get_patient_screening_status($1)
  `;

  const result = await this.db.query(query, [patientId]);
  return result.rows[0];
}
```

### For Notification System

```typescript
// Identify patients needing lab orders
async getPatientsNeedingLabs() {
  const query = `
    SELECT * FROM v_patients_requiring_action
    WHERE action_category = 'ORDER_LABS'
    AND next_action_date <= CURRENT_DATE + INTERVAL '7 days'
    ORDER BY priority_score DESC
  `;

  const result = await this.db.query(query);
  return result.rows;
}
```

---

## Fallback Variable Coverage

| Variable | Location | Purpose | Status |
|----------|----------|---------|--------|
| **Demographics** |
| Age | `patients.date_of_birth` | Risk factor if >60 | ✅ |
| Ethnicity | `patients.ethnicity` | Risk adjustment | ✅ |
| Race | `patients.race` | Risk adjustment | ✅ |
| **Comorbidities** |
| Diabetes | `patients.has_diabetes` | Primary risk factor | ✅ |
| Hypertension | `patients.has_hypertension` | Primary risk factor | ✅ |
| Heart Failure | `patients.has_heart_failure` | CVD risk | ✅ |
| CAD | `patients.has_cad` | CVD risk | ✅ |
| Obesity | `patients.has_obesity` (computed from BMI) | Metabolic risk | ✅ |
| **Vitals** |
| Blood Pressure | `observations` (type: 'blood_pressure_systolic/diastolic') | HTN monitoring | ✅ |
| BMI | Computed from `weight` and `height` | Obesity screening | ✅ |
| **Medications** |
| Diabetes Meds | `patient_medications.is_diabetes_medication` | Diagnosis proxy | ✅ |
| BP Meds | `patient_medications.is_hypertension_medication` | Diagnosis proxy | ✅ |
| Nephrotoxic Meds | `patient_medications.is_nephrotoxic` | Risk factor | ✅ |
| RAS Inhibitors | `patient_medications.is_ras_inhibitor` | Protective therapy | ✅ |
| SGLT2i | `patient_medications.is_sglt2i` | Protective therapy | ✅ |
| **Lab Results** |
| eGFR | `observations` (type: 'eGFR') | Kidney function | ✅ |
| uACR | `observations` (type: 'uACR') | Proteinuria | ✅ |
| HbA1c | `observations` (type: 'HbA1c') | Diabetes control | ✅ |
| **Diagnoses** |
| ICD-10 Codes | `conditions.condition_code` | All diagnoses | ✅ |
| Status | `conditions.clinical_status` | Active vs resolved | ✅ |

---

## Clinical Decision Logic

### When to Order Labs (Tier 3 Branch A)

```
IF patient has:
   • Risk factors present (diabetes, HTN, age >60, etc.)
   AND
   • Missing eGFR or uACR from last 12 months

THEN recommend:
   "Order baseline eGFR and uACR tests within 2 weeks"

PRIORITY increases with:
   • Multiple risk factors (3+)
   • Age >65
   • Family history of ESRD
   • Active nephrotoxic medication use
```

### When to Confirm Abnormal Results (Tier 3 Branch B)

```
IF patient has:
   • Recent labs showing eGFR <60 OR uACR >30

THEN recommend:
   "Repeat testing in 3 months to confirm CKD diagnosis"
   "If eGFR <30, consider nephrology referral"
```

### When to Monitor Routinely (Tier 3 Branch B - Normal)

```
IF patient has:
   • Risk factors present
   AND
   • Recent labs are normal (eGFR ≥60, uACR ≤30)

THEN recommend:
   "Re-screen annually"
   "Continue blood pressure and glucose control"
   "Lifestyle modifications"
```

---

## Usage Examples for Doctor Assistant

### Scenario 1: "What tests does this patient need?"

**AI Query**:
```sql
SELECT ai_recommendation, missing_labs, next_action_date
FROM v_tier3_risk_classification
WHERE patient_id = :patient_id;
```

**AI Response**:
> "Based on this patient's diabetes diagnosis, they need baseline kidney screening. I recommend ordering:
> - eGFR (kidney filtration rate)
> - uACR (protein in urine)
> - HbA1c (diabetes control)
>
> These should be ordered within the next 2 weeks. This is standard screening per KDIGO 2024 guidelines for diabetic patients."

### Scenario 2: "Show me patients who need labs ordered"

**AI Query**:
```sql
SELECT * FROM v_patients_requiring_action
WHERE action_category = 'ORDER_LABS'
ORDER BY priority_score DESC
LIMIT 10;
```

**AI Response**:
> "I've identified 10 patients who need lab work ordered:
>
> **High Priority**:
> 1. John Smith (MRN12345) - Diabetes, no labs in 18 months - Missing: eGFR, uACR, HbA1c
> 2. Jane Doe (MRN67890) - Hypertension + Age 72, no kidney function tests - Missing: eGFR, uACR
>
> **Moderate Priority**:
> 3. Robert Johnson (MRN24680) - Diabetes, missing HbA1c only
>
> Would you like me to generate lab order templates for these patients?"

### Scenario 3: "Why is this patient flagged?"

**AI Query**:
```sql
SELECT
    ai_flag,
    ai_recommendation,
    risk_factor_count,
    primary_risk_factor,
    missing_labs
FROM v_tier3_risk_classification
WHERE patient_id = :patient_id;
```

**AI Response**:
> "This patient is flagged because:
> - They have 3 risk factors: Diabetes, Hypertension, Age >60
> - No kidney function tests (eGFR, uACR) in the last 12 months
> - Status: HIGH RISK - Screening Needed
>
> Recommendation: Order baseline kidney screening. With multiple risk factors, early detection is crucial."

---

## Benefits of This System

1. **No Patient Left Behind**: Even without labs, risk factors trigger appropriate screening recommendations

2. **Intelligent Prioritization**: Patients with multiple risk factors get higher priority scores

3. **Actionable Insights**: System doesn't just flag problems - it tells doctors exactly what to order

4. **Medication-Based Inference**: If diagnosis codes are missing, medications provide proxy information

5. **Tiered Approach**: Efficient funnel system screens entire population, focusing on high-risk subset

6. **KDIGO-Compliant**: Recommendations follow 2024 KDIGO guidelines for CKD screening

---

## Migration Deployment

```bash
# Run migrations 011 and 012
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db \
  -f /docker-entrypoint-initdb.d/migrations/011_add_general_medications_and_obesity_flag.sql

docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db \
  -f /docker-entrypoint-initdb.d/migrations/012_add_screening_workflow_logic.sql
```

---

## Summary

The Fallback Screening System ensures that **lack of data is not a dead end**. Instead, it:

1. **Identifies at-risk patients** using comorbidities and demographics (Tier 1)
2. **Checks for recent labs** and routes appropriately (Tier 2)
3. **Generates specific recommendations** based on data availability (Tier 3)
   - Missing data → Order these specific tests
   - Abnormal data → Confirm with repeat testing
   - Normal data → Continue routine monitoring

The AI agent can now provide intelligent, actionable recommendations regardless of data completeness. 🎯
