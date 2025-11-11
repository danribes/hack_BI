# Progression Timeline Troubleshooting Guide

## Common Issue: Database Tables Not Created

### Symptoms
- Error when accessing Progression Timeline
- "Failed to initialize baseline" error
- Database query errors in console
- 500 Internal Server Error from `/api/progression/patient/:id/initialize`

### Root Cause
The new database tables required for dynamic progression haven't been created yet.

### Solution
Run the initialization script to create the required tables:

```bash
# Option 1: Using psql (if available locally)
psql "postgresql://ckd_analyzer_eb21_user:OwbWCc7tYEUlErS18EHMqI2SdBWulXAb@dpg-d48qr8ali9vc739fg2gg-a/ckd_analyzer_eb21" -f scripts/initialize_dynamic_progression.sql

# Option 2: Using online PostgreSQL client
# 1. Go to https://sqliteonline.com/#postgres
# 2. Click "PostgreSQL" tab
# 3. Connect using:
#    Host: dpg-d48qr8ali9vc739fg2gg-a.oregon-postgres.render.com
#    Database: ckd_analyzer_eb21
#    User: ckd_analyzer_eb21_user
#    Password: OwbWCc7tYEUlErS18EHMqI2SdBWulXAb
# 4. Copy and paste contents of scripts/initialize_dynamic_progression.sql
# 5. Execute
```

## Tables Created by Migration

The script creates these tables:
1. **patient_progression_state** - Stores progression parameters (type, rates, baseline)
2. **health_state_history** - KDIGO classifications per cycle
3. **state_transitions** - Records when patients move between health states
4. **monitoring_alerts** - AI-generated alerts
5. **action_recommendations** - Clinical recommendations

## Verification

After running the script, verify tables exist:

```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'patient_progression_state',
  'health_state_history',
  'state_transitions',
  'monitoring_alerts',
  'action_recommendations'
);
```

Expected output: All 5 tables listed.

## API Endpoint Test

Test the baseline initialization endpoint:

```bash
# Get first patient ID
curl http://localhost:3000/api/patients | jq '.[0].id'

# Initialize baseline (replace PATIENT_ID)
curl -X POST http://localhost:3000/api/progression/patient/PATIENT_ID/initialize

# Expected response:
# {
#   "status": "success",
#   "message": "Baseline initialized",
#   "cycle": { ... },
#   "timestamp": "..."
# }
```

## Frontend Error Logs

Check browser console for specific errors:

1. **Open DevTools** (F12 or Ctrl+Shift+I)
2. **Navigate to Console tab**
3. **Click "Progression Timeline" tab**
4. **Look for red error messages**

Common error messages and fixes:

### Error: "Failed to fetch"
- **Cause**: Backend not running or CORS issue
- **Fix**: Ensure backend is running on port 3000
- **Check**: `curl http://localhost:3000/api/patients`

### Error: "relation 'patient_progression_state' does not exist"
- **Cause**: Database migration not run
- **Fix**: Run `initialize_dynamic_progression.sql` script (see above)

### Error: "Failed to initialize baseline"
- **Cause**: Patient might not have lab results
- **Fix**: Ensure patient has eGFR and uACR values in database

### Error: "TypeError: Cannot read property 'gfrCategory' of undefined"
- **Cause**: Classification returned null/undefined
- **Fix**: Check patient's lab values are valid numbers

## Manual Database Verification

Check if patient has lab results:

```sql
SELECT
  p.id,
  p.first_name,
  p.last_name,
  lr.egfr,
  lr.urine_albumin_creatinine_ratio as uacr
FROM patients p
LEFT JOIN lab_results lr ON p.id = lr.patient_id
LIMIT 10;
```

All patients should have eGFR values. If null, generate test data.

## Backend Logs

Check backend console for detailed error messages:

```bash
# If running locally
npm run dev

# Look for lines like:
# [Progression API] Initializing baseline for patient ...
# [Progression API] Error: ...
```

## Quick Reset

If data becomes corrupted, reset progression data:

```sql
-- WARNING: This deletes all progression data
TRUNCATE TABLE action_recommendations CASCADE;
TRUNCATE TABLE monitoring_alerts CASCADE;
TRUNCATE TABLE state_transitions CASCADE;
TRUNCATE TABLE health_state_history CASCADE;
TRUNCATE TABLE patient_progression_state CASCADE;
```

Then navigate to Progression Timeline - it will regenerate from scratch.

## Still Having Issues?

1. **Check database connection**: Verify environment variables in `.env`
2. **Check backend logs**: Look for SQL errors or query failures
3. **Check network**: Ensure API calls reach backend (Network tab in DevTools)
4. **Verify CORS**: Backend should allow frontend origin

## Expected Behavior

When working correctly:
1. Select patient → Baseline (Month 0) initializes automatically
2. Click "Next" → Shows "Generating progression data with AI monitoring..."
3. Month 1 data appears with eGFR, uACR, and KDIGO classification
4. If state changes → Alert appears with recommendations
5. Can navigate backward/forward through generated cycles

## Contact

If issues persist after following this guide, provide:
- Full error message from browser console
- Backend log output
- SQL query that's failing (if visible)
- Screenshot of the error
