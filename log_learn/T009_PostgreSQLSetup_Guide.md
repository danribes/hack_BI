# T009: PostgreSQL Setup - Educational Guide

**Topic**: PostgreSQL Database Design for Healthcare Applications
**Date**: 2025-11-08
**Level**: Intermediate

---

## Overview

This guide covers PostgreSQL database design for healthcare applications, focusing on CKD (Chronic Kidney Disease) patient data management.

---

## Key Concepts

### 1. Healthcare Database Schema Design

**Core Tables**:
- **patients**: Demographics and identifiers (UUID, MRN)
- **observations**: Lab results and measurements (time-series data)
- **conditions**: Diagnoses and comorbidities (ICD-10 coded)
- **risk_assessments**: AI-generated risk scores

**Why This Structure**:
- Normalized design (3NF) reduces data duplication
- Foreign keys ensure referential integrity
- Indexes optimize query performance
- Separate tables allow independent scaling

### 2. UUIDs vs Auto-Increment IDs

**UUID (used in this project)**:
```sql
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
```

**Advantages**:
- Globally unique (safe for distributed systems)
- No collision risk when merging databases
- Privacy (not sequential, harder to guess)

**Disadvantages**:
- 128-bit vs 32-bit (larger storage)
- Slightly slower joins

**Auto-Increment Alternative**:
```sql
id SERIAL PRIMARY KEY
```

### 3. ICD-10 Clinical Coding

**Why ICD-10 Codes**:
- International standard for diagnoses
- Required for billing/insurance
- Enables data analysis across institutions

**Examples**:
- `E11.9` = Type 2 Diabetes Mellitus
- `N18.4` = CKD Stage 4 (eGFR 15-29)
- `I10` = Essential Hypertension

### 4. Clinical Observations Design

**Flexible Schema**:
```sql
observation_type VARCHAR(50)  -- 'eGFR', 'creatinine', 'uACR'
value_numeric DECIMAL(10,2)   -- Numeric values
value_text VARCHAR(100)        -- Text values (if needed)
unit VARCHAR(20)               -- 'mg/dL', 'mL/min/1.73m²'
```

**Benefits**:
- Single table for all observation types
- Easy to add new observation types
- Consistent querying pattern

**Alternative (EAV Pattern)**:
- Entity-Attribute-Value for extreme flexibility
- More complex queries but ultra-flexible

### 5. Indexes for Performance

**Created Indexes**:
```sql
CREATE INDEX idx_observations_patient_id ON observations(patient_id);
CREATE INDEX idx_observations_type ON observations(observation_type);
CREATE INDEX idx_observations_date ON observations(observation_date);
```

**Why Important**:
- patient_id: Fast patient lookup (most common query)
- observation_type: Filter by lab type (eGFR, creatinine)
- observation_date: Time-series queries, trends

**Query Performance**:
- Without index: Full table scan (slow)
- With index: B-tree lookup (fast, O(log n))

### 6. CKD Staging (KDIGO Guidelines)

**eGFR-Based Staging**:
- G1: eGFR ≥90 (Normal/high)
- G2: eGFR 60-89 (Mildly decreased)
- G3a: eGFR 45-59 (Mild-moderately decreased)
- G3b: eGFR 30-44 (Moderately-severely decreased)
- G4: eGFR 15-29 (Severely decreased)
- G5: eGFR <15 (Kidney failure)

**Mock Patients Stages**:
- Patient 1: G4 (eGFR 28.5)
- Patient 2: G3a (eGFR 52.3)
- Patient 3: G1 (eGFR 95.2)
- Patient 4: G3b (eGFR 38.7)
- Patient 5: G2 (eGFR 68.5)

### 7. Docker-Mounted Init Scripts

**How It Works**:
```yaml
# docker-compose.yml
volumes:
  - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
```

**Execution**:
1. First container start: PostgreSQL runs all scripts in `/docker-entrypoint-initdb.d/`
2. Scripts run in alphabetical order
3. Only runs if database doesn't exist
4. Read-only mount (`:ro`) prevents accidental modification

---

## Best Practices

### ✅ Do
- Use UUIDs for distributed systems
- Create indexes on foreign keys and frequently queried columns
- Use ICD-10 codes for conditions
- Validate data constraints (NOT NULL, UNIQUE)
- Include timestamps (created_at, updated_at)
- Use views for complex queries (patient_summary)

### ❌ Don't
- Don't store PII without encryption (if production)
- Don't use SELECT * in production code
- Don't forget CASCADE rules (data cleanup)
- Don't skip indexes on large tables
- Don't hardcode patient data in production (use migrations)

---

## Summary

**Key Takeaways**:
1. Normalize healthcare data (patients, observations, conditions)
2. Use UUIDs for globally unique identifiers
3. ICD-10 codes enable standard clinical coding
4. Indexes critical for query performance
5. Docker init scripts automate database setup
6. Realistic mock data essential for testing

---

**Guide Complete** ✅
