# How to Clean and Re-Populate Your Database

This guide shows you how to safely **erase all patient records** and start fresh with the new verified scripts that ensure no duplicates and proper gender-name concordance.

---

## What This Guide Does

✅ **Safely deletes all patient data** without removing the database
✅ **Preserves database schema** (all tables remain)
✅ **Re-populates with 1001 verified patients**
✅ **Ensures no duplicate names**
✅ **Ensures proper gender-name concordance**

⚠️ **WARNING**: This will delete ALL patient records. Make sure you have a backup if needed.

---

## Prerequisites

Before starting, ensure you have:

- [x] Access to your database (DATABASE_URL set)
- [x] Terminal with `psql` installed
- [x] Located in the `scripts` directory
- [x] 15-20 minutes of time for the full process

---

## Step-by-Step Process

### Step 1: Navigate to Scripts Directory

```bash
cd scripts
ls -la
```

You should see:
- `cleanup_all_patient_data.sql` ✓
- `populate_1001_patients_verified.sql` ✓

### Step 2: Set Database URL (if not already set)

```bash
export DATABASE_URL="postgresql://your_user:your_password@your_host.render.com/your_database"
```

**Example:**
```bash
export DATABASE_URL="postgresql://ckd_analyzer_user:yJkMuyiKFr66xgY1Kmk6iYstGuCSaCg5@dpg-d49o1cq4d50c739iihig-a.oregon-postgres.render.com/ckd_analyzer_db"
```

### Step 3: Verify Database Connection

Test your connection before making changes:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"
```

You should see the current patient count. This confirms the connection works.

### Step 4: Run the Cleanup Script (⏱️ ~1 minute)

```bash
psql "$DATABASE_URL" -f cleanup_all_patient_data.sql
```

#### Expected Output:

```
=========================================
CURRENT DATABASE STATE (BEFORE CLEANUP)
=========================================

   table_name   | record_count
----------------+--------------
 Patients       |          500  (or 1001, or whatever you had)
 Observations   |        40000
 Conditions     |         3000
 Prescriptions  |         3500
 Refills        |        40000
 ...

=========================================
STARTING DATA CLEANUP...
=========================================

Deleted all refills
Deleted all prescriptions
Deleted all observations
Deleted all conditions
Deleted all urine analysis records
Deleted all hematology records
Deleted all risk assessments
Deleted all treatment recommendations
Deleted all adherence monitoring records
Deleted all patients

=========================================
CLEANUP COMPLETED SUCCESSFULLY!
=========================================

=========================================
DATABASE STATE (AFTER CLEANUP)
=========================================

   table_name   | record_count
----------------+--------------
 Patients       |            0  ✓
 Observations   |            0  ✓
 Conditions     |            0  ✓
 Prescriptions  |            0  ✓
 Refills        |            0  ✓
 ...

=========================================
ALL PATIENT DATA HAS BEEN DELETED
=========================================

Database schema is preserved (tables still exist).
Reference data (medications table) is preserved.

NEXT STEPS:
1. Run: psql "$DATABASE_URL" -f populate_1001_patients_verified.sql
2. Wait 10-15 minutes for 1001 patients to be generated
3. Verify no duplicates and proper gender-name concordance

All counts should now be 0 (zero).
=========================================
```

### Step 5: Verify All Data Is Deleted

Check that all tables are empty:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM observations;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM prescriptions;"
```

**Expected Result**: All counts should be **0**.

If you see non-zero counts, **STOP** and investigate before proceeding.

### Step 6: Re-Populate with Verified Patients (⏱️ 10-15 minutes)

Now run the verified patient generation script:

```bash
psql "$DATABASE_URL" -f populate_1001_patients_verified.sql
```

#### Expected Output:

```
========================================
Starting population of 1001 patients with unique names...
========================================

NOTICE:  Processed 100 patients...
NOTICE:  Processed 200 patients...
NOTICE:  Processed 300 patients...
NOTICE:  Processed 400 patients...
NOTICE:  Processed 500 patients...
NOTICE:  Processed 600 patients...
NOTICE:  Processed 700 patients...
NOTICE:  Processed 800 patients...
NOTICE:  Processed 900 patients...
NOTICE:  Processed 1000 patients...

NOTICE:  Successfully populated 1001 patients!

========================================
POST-GENERATION VERIFICATION
========================================

--- DUPLICATE NAME CHECK ---
NOTICE:  ✓ PASSED: No duplicate names found!

--- GENDER-NAME CONCORDANCE CHECK ---
NOTICE:  ✓ PASSED: All names match patient gender!

========================================
VERIFICATION SUMMARY
========================================

Total Patients: 1001
Gender Distribution:
  - Males: 481 (48.0%)
  - Females: 520 (52.0%)

CKD Prevalence: ~70%
Total Observations: 40,040
Total Prescriptions: 3,503
Total Refills: 42,036
Total Conditions: 3,003

eGFR Distribution (CKD Stage):
  - G1 (≥90): 150 patients
  - G2 (60-89): 150 patients
  - G3a (45-59): 200 patients
  - G3b (30-44): 200 patients
  - G4 (15-29): 150 patients
  - G5 (<15): 150 patients

✓ Population completed successfully with verification!
```

⚠️ **IMPORTANT**: Wait for the **full 10-15 minutes**. Do not interrupt the process.

### Step 7: Verify the New Data

Check that exactly 1001 patients were created:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_patients FROM patients;"
```

**Expected:** `total_patients | 1001`

### Step 8: Verify No Duplicates

```bash
psql "$DATABASE_URL" -c "
SELECT
    first_name,
    last_name,
    COUNT(*) as count
FROM patients
GROUP BY first_name, last_name
HAVING COUNT(*) > 1;
"
```

**Expected:** `(0 rows)` - No duplicates found ✓

### Step 9: Verify Gender-Name Concordance

Check for males with female names:

```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as male_with_female_names
FROM patients
WHERE gender = 'male'
  AND first_name IN ('Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen');
"
```

**Expected:** `male_with_female_names | 0` ✓

Check for females with male names:

```bash
psql "$DATABASE_URL" -c "
SELECT COUNT(*) as female_with_male_names
FROM patients
WHERE gender = 'female'
  AND first_name IN ('James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel');
"
```

**Expected:** `female_with_male_names | 0` ✓

### Step 10: Verify Gender Distribution

```bash
psql "$DATABASE_URL" -c "
SELECT
    gender,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM patients), 1) as percentage
FROM patients
GROUP BY gender;
"
```

**Expected:**
```
 gender | count | percentage
--------+-------+------------
 female |   520 |       52.0
 male   |   481 |       48.0
```

### Step 11: Test Your Application

1. **Start your backend**:
   ```bash
   cd ../backend
   npm run dev
   ```

   You should see:
   ```
   ✓ Database connected successfully
   Server running on port 3000
   ```

2. **Start your frontend**:
   ```bash
   cd ../frontend
   npm run dev
   ```

3. **Open http://localhost:5173**

4. **Verify**:
   - You should see **1001 patients** in the patient list
   - Click on patients to view their detailed cards
   - Check vital signs, comorbidities, and symptoms are displayed

---

## Troubleshooting

### Issue: Cleanup script fails partway through

**Error:**
```
ERROR: update or delete on table "patients" violates foreign key constraint
```

**Solution:**
The cleanup script should handle this automatically with the correct deletion order. If you see this error:

1. Check which table caused the error
2. Manually delete that table first:
   ```bash
   psql "$DATABASE_URL" -c "DELETE FROM [table_name];"
   ```
3. Re-run the cleanup script

### Issue: Population script shows ✗ FAILED for duplicates

**Error:**
```
NOTICE: ✗ FAILED: Found 3 duplicate name combinations!
```

**Solution:**

1. **Option 1: Re-run the cleanup and try again**
   ```bash
   psql "$DATABASE_URL" -f cleanup_all_patient_data.sql
   psql "$DATABASE_URL" -f populate_1001_patients_verified.sql
   ```

2. **Option 2: Use the fix script**
   ```bash
   psql "$DATABASE_URL" -f fix_duplicate_names.sql
   ```
   Then verify:
   ```bash
   psql "$DATABASE_URL" -c "SELECT first_name, last_name, COUNT(*) FROM patients GROUP BY first_name, last_name HAVING COUNT(*) > 1;"
   ```

### Issue: Population script shows ✗ FAILED for gender-name concordance

**Error:**
```
NOTICE: ✗ FAILED: Found 2 gender-name mismatches!
WARNING:    - Males with female names: 1
WARNING:    - Females with male names: 1
```

**Solution:**

This should **NOT** happen with the verified script. If it does:

1. **Check the detailed output** to see which patients have issues
2. **Re-run cleanup and population**:
   ```bash
   psql "$DATABASE_URL" -f cleanup_all_patient_data.sql
   psql "$DATABASE_URL" -f populate_1001_patients_verified.sql
   ```
3. **If issue persists**, report it with the specific patient details shown in the error output

### Issue: Population takes longer than 15 minutes

**Cause**: Slow database connection or network issues

**Solution:**
- Let it continue running (may take up to 20-25 minutes on slow connections)
- Check your network connection
- Check Render.com status: https://status.render.com/
- If it times out, increase the timeout and retry:
  ```bash
  psql "$DATABASE_URL" --set statement_timeout=1800000 -f populate_1001_patients_verified.sql
  ```

### Issue: Frontend still shows old patient count

**Cause**: Browser cache or backend not restarted

**Solution:**
1. Restart your backend server (Ctrl+C and `npm run dev`)
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the patient count in the database directly:
   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"
   ```

---

## Complete Verification Checklist

After completing all steps, verify:

- [ ] Database connection works
- [ ] Cleanup script ran successfully
- [ ] All tables show 0 records after cleanup
- [ ] Population script completed (10-15 minutes)
- [ ] Exactly 1001 patients created
- [ ] ✓ PASSED: No duplicate names
- [ ] ✓ PASSED: Gender-name concordance
- [ ] Gender distribution is ~50/50 (481 male, 520 female)
- [ ] No males with female names (count = 0)
- [ ] No females with male names (count = 0)
- [ ] Backend connects successfully
- [ ] Frontend displays 1001 patients
- [ ] Patient cards show vital signs, comorbidities, and symptoms

---

## Summary of Commands (Quick Reference)

```bash
# 1. Navigate to scripts
cd scripts

# 2. Set database URL
export DATABASE_URL="postgresql://user:password@host.render.com/database"

# 3. Test connection
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"

# 4. Clean all data
psql "$DATABASE_URL" -f cleanup_all_patient_data.sql

# 5. Verify empty
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"

# 6. Re-populate with verified patients (wait 10-15 min)
psql "$DATABASE_URL" -f populate_1001_patients_verified.sql

# 7. Verify 1001 patients
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"

# 8. Check for duplicates (should be 0 rows)
psql "$DATABASE_URL" -c "SELECT first_name, last_name, COUNT(*) FROM patients GROUP BY first_name, last_name HAVING COUNT(*) > 1;"

# 9. Test backend
cd ../backend && npm run dev

# 10. Test frontend
cd ../frontend && npm run dev
```

---

## What Was Preserved

✅ **Database schema** (all tables still exist)
✅ **Table structure** (columns, data types)
✅ **Indexes** (for query performance)
✅ **Foreign key relationships**
✅ **Reference data** (medications table)

## What Was Deleted

🗑️ **All patient records** (patients table)
🗑️ **All observations** (lab results, vitals)
🗑️ **All conditions** (diagnoses)
🗑️ **All prescriptions** (medications)
🗑️ **All refills** (adherence data)
🗑️ **All urine analysis** records
🗑️ **All hematology** records
🗑️ **All risk assessments**
🗑️ **All treatment recommendations**
🗑️ **All adherence monitoring** records

---

## Next Steps After Successful Re-Population

1. ✅ **Test the Doctor Assistant**
   - Ask: "How many patients are there?" (should say 1001)
   - Ask: "Show me patients at high risk of CKD"
   - Ask: "What is the average eGFR?"

2. ✅ **Explore Patient Data**
   - Click on patients in the frontend
   - Verify comprehensive patient cards display:
     - Demographics
     - Vital Signs (BP, heart rate, O2 sat, BMI)
     - Comorbidities (diabetes, hypertension, heart failure, etc.)
     - Clinical Symptoms (appetite, edema, anemia)
     - Lab results (eGFR, uACR, creatinine, etc.)

3. ✅ **Deploy to Production** (if ready)
   - Commit your changes
   - Push to GitHub
   - Wait for Render to auto-deploy
   - Test in production environment

4. ✅ **Monitor Your Database**
   - Check Render dashboard for usage stats
   - Verify storage is within limits (1 GB on free plan)
   - Monitor connection counts

---

## Support

If you encounter issues not covered in this guide:

1. Check the main setup guide: `/DATABASE_CREATION_GUIDE.md`
2. Check patient generation documentation: `/scripts/README_PATIENT_GENERATION.md`
3. Check the database setup guide: `/DATABASE_SETUP_RENDER_ONLY.md`
4. Check Render.com status: https://status.render.com/

---

**✅ You now have a clean database with 1001 verified patients, no duplicates, and proper gender-name concordance!**
