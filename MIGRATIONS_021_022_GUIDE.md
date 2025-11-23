# Running Migrations 021-022 on Render: Doctor-Patient Assignment System

This guide walks you through setting up the doctor-patient assignment system on your Render PostgreSQL database.

## What These Migrations Do

**Migration 021**: Creates `doctor_patient_assignments` table
- Maps each patient to their assigned doctor(s)
- Supports primary and consulting doctors
- Automatically assigns all existing patients to a default doctor

**Migration 022**: Creates `doctors` table
- Stores doctor profiles (name, email, specialty)
- Notification preferences (JSONB format)
- Email signatures and facility branding
- Creates helpful database view for lookups

## Quick Start (5 minutes)

### Prerequisites
- Access to your Render dashboard
- Node.js installed (already available if you're running the backend)
- Your project cloned locally

**Note:** This guide uses a Node.js script that works in all environments (Codespaces, local, CI/CD). No need to install `psql`!

### Step-by-Step Instructions

#### Step 1: Get Your Database URL from Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your database service (e.g., `ckd-analyzer-db` or `healthcare_ai_db_fo2v`)
3. Scroll down to the **Connections** section
4. Copy the **External Database URL**
   - It looks like: `postgresql://user:password@host/database`
   - Example: `postgresql://healthcare_user:XxXxX...@dpg-abc123.oregon-postgres.render.com/healthcare_ai_db_fo2v`

#### Step 2: Run the Migration Script

**Using Node.js (Recommended - works everywhere)**

```bash
cd /workspaces/hack_BI
node scripts/run_migrations_021_022.js 'postgresql://YOUR_DATABASE_URL_HERE'
```

**Example:**
```bash
node scripts/run_migrations_021_022.js 'postgresql://healthcare_user:2IDoqcoj1ERr9SAJgfEk6GQyDBUXhCpJ@dpg-d4c4tuadbo4c73d1s0p0-a.oregon-postgres.render.com/healthcare_ai_db_fo2v'
```

#### Step 3: Review the Migration Output

The script will show you:

**Before:**
```
📊 Current Database State
   Total patients: 1000
   doctor_patient_assignments table exists: No
   doctors table exists: No
```

**During:**
```
🚀 Running migrations...

Migration 021: Doctor-Patient Assignments
Running migration 021...
✅ Migration 021 completed successfully!

Migration 022: Doctors Table
Running migration 022...
✅ Migration 022 completed successfully!
```

**After:**
```
📊 Final Database State
   Total patients: 1000
   Doctor-patient assignments: 1000
   Doctors in system: 1

   Assignment Summary:
   - doctor@example.com: 1000 patients

✅ All migrations completed successfully!
```

#### Step 4: Restart Your Backend Service on Render

**Important:** After running migrations, you must restart your backend service to activate the new features.

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your backend service (e.g., `ckd-analyzer-backend`)
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait for the deployment to complete

**What this activates:**
- ✅ Alert Reminder Service (checks every 30 minutes for unacknowledged CRITICAL alerts)
- ✅ Doctor lookup for all email notifications
- ✅ New API endpoints: `/api/doctors`

---

## What Happens After Migration

### Default State

All existing patients are automatically assigned to:
- **Email:** `doctor@example.com`
- **Name:** `Default Doctor`
- **Role:** Primary doctor

### You Can Now:

1. **Create Real Doctor Profiles**
2. **Assign Doctors to Patients**
3. **Configure Notification Preferences**
4. **Receive Automated Alert Reminders**

---

## Next Steps: Configure Your Doctors

### 1. Create Doctor Profiles

Use the new `/api/doctors` endpoint:

```bash
# Create a new doctor
POST https://your-backend.onrender.com/api/doctors
Content-Type: application/json

{
  "email": "dr.smith@hospital.com",
  "name": "Dr. Sarah Smith",
  "specialty": "Nephrology",
  "phone": "555-0123",
  "notification_preferences": {
    "critical_via": "email",
    "high_via": "email",
    "moderate_via": "email",
    "quiet_hours_enabled": true,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "07:00"
  }
}
```

### 2. Assign Doctors to Patients

```bash
# Assign a doctor to a specific patient
POST https://your-backend.onrender.com/api/patients/{patient-id}/assign-doctor
Content-Type: application/json

{
  "doctor_email": "dr.smith@hospital.com",
  "doctor_name": "Dr. Sarah Smith",
  "is_primary": true
}
```

**Bulk Assignment Script** (update all patients at once):

```bash
# Get all patients
GET https://your-backend.onrender.com/api/patients

# For each patient, assign the doctor
# You can create a simple script to do this
```

### 3. Verify Assignments

```bash
# Get all doctors for a patient
GET https://your-backend.onrender.com/api/patients/{patient-id}/doctors

# Get primary doctor for a patient
GET https://your-backend.onrender.com/api/patients/{patient-id}/primary-doctor

# List all doctors in the system
GET https://your-backend.onrender.com/api/doctors
```

---

## How the System Works Now

### Email Notifications

**Before Migration:**
- ❌ All alerts sent to hardcoded `doctor@example.com`
- ❌ No way to assign specific doctors to patients

**After Migration:**
- ✅ Each patient can have an assigned primary doctor
- ✅ Alerts automatically sent to the assigned doctor's email
- ✅ Support for multiple doctors per patient
- ✅ Notification preferences per doctor

### Alert Types That Now Use Doctor Assignment

All 4 clinical alert types now fetch the assigned doctor:

1. **Worsening Trends** - eGFR decline >10% or uACR increase >25%
2. **Health State Deterioration** - CKD stage progression
3. **Poor Medication Adherence** - Adherence <75%
4. **Minuteful Kidney Worsening** - Home monitoring uACR increase >30%

### Alert Reminder System

**Automatic Reminders for Unacknowledged CRITICAL Alerts:**

- Checks every **30 minutes**
- Sends reminders for alerts older than **4 hours**
- Maximum **3 reminder attempts** per alert
- Escalating reminder messages
- Tracks retry count in database

**Example Reminder Email:**
```
Subject: 🔴 REMINDER #2: ⚠️ CRITICAL: John Doe - Health State Deteriorated to G4-A2

⚠️ REMINDER #2 - UNACKNOWLEDGED CRITICAL ALERT

This alert was sent 8 hours ago and has not been acknowledged.

[Original alert content]

Action Required:
• Please acknowledge this alert in the system
• Review patient status and take appropriate clinical action
• If already addressed, mark as acknowledged to prevent further reminders
```

---

## API Endpoints Reference

### Doctor Management

```bash
# List all doctors
GET /api/doctors

# Create a new doctor
POST /api/doctors
{
  "email": "string",
  "name": "string",
  "specialty": "string",
  "phone": "string",
  "notification_preferences": {}
}

# Get doctor by email
GET /api/doctors/:email

# Update doctor profile
PUT /api/doctors/:email
{
  "name": "string",
  "notification_preferences": {},
  "email_signature": "string",
  "facility_name": "string"
}
```

### Patient-Doctor Assignment

```bash
# Assign doctor to patient
POST /api/patients/:id/assign-doctor
{
  "doctor_email": "string",
  "doctor_name": "string",
  "is_primary": true
}

# Get all doctors for a patient
GET /api/patients/:id/doctors

# Remove doctor assignment
DELETE /api/patients/:id/doctors/:email

# Get primary doctor
GET /api/patients/:id/primary-doctor
```

---

## Notification Preferences Format

The `notification_preferences` field is JSONB with this structure:

```json
{
  "critical_via": "email",      // How to send CRITICAL alerts (email, sms, both, none)
  "high_via": "email",          // How to send HIGH alerts
  "moderate_via": "email",      // How to send MODERATE alerts
  "quiet_hours_enabled": false, // Enable quiet hours (no alerts during this time)
  "quiet_hours_start": "22:00", // Quiet hours start time (24h format)
  "quiet_hours_end": "07:00"    // Quiet hours end time (24h format)
}
```

**Note:** Quiet hours are checked but CRITICAL alerts may still be sent for patient safety.

---

## Troubleshooting

### "Cannot connect to database"
- Check that your DATABASE_URL is correct
- Ensure you copied the **External Database URL** (not Internal)
- Verify your database is running on Render

### "Migration file not found"
- Make sure you're running the command from the project root directory
- Verify files exist:
  - `infrastructure/postgres/migrations/021_add_doctor_patient_assignments.sql`
  - `infrastructure/postgres/migrations/022_add_doctors_table.sql`

### "Table already exists"
- The script will ask if you want to re-run
- Safe to re-run (uses `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT`)
- Existing data will not be lost

### "Alert reminder service not starting"
- Check backend logs on Render
- Verify database connection is working
- Service will attempt to start on next deployment

### Need to Rollback?

If you need to remove the tables:

```sql
-- WARNING: This will delete all doctor assignments!
DROP TABLE IF EXISTS doctor_patient_assignments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP VIEW IF EXISTS patient_doctor_assignments_with_prefs;
```

---

## Verification Checklist

After running migrations, verify everything works:

- [ ] Migrations completed without errors
- [ ] Backend service restarted on Render
- [ ] Can create a doctor: `POST /api/doctors`
- [ ] Can assign doctor to patient: `POST /api/patients/:id/assign-doctor`
- [ ] Can fetch patient's doctors: `GET /api/patients/:id/doctors`
- [ ] Check backend logs for "Alert reminder service started"
- [ ] Test email notification still works
- [ ] Verify emails now sent to assigned doctor

---

## Example Workflow

Here's a complete example of setting up the system:

```bash
# 1. Run migrations
node scripts/run_migrations_021_022.js 'postgresql://...'

# 2. Restart backend on Render (via dashboard)

# 3. Create a real doctor profile
curl -X POST https://your-backend.onrender.com/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.jones@hospital.com",
    "name": "Dr. Michael Jones",
    "specialty": "Nephrology",
    "notification_preferences": {
      "critical_via": "email",
      "high_via": "email",
      "moderate_via": "none"
    }
  }'

# 4. Assign doctor to a patient
curl -X POST https://your-backend.onrender.com/api/patients/abc-123/assign-doctor \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_email": "dr.jones@hospital.com",
    "doctor_name": "Dr. Michael Jones",
    "is_primary": true
  }'

# 5. Verify assignment
curl https://your-backend.onrender.com/api/patients/abc-123/primary-doctor
```

---

## Support

If you encounter issues:

1. Check backend logs on Render for detailed error messages
2. Verify database connection: Run a simple query to test
3. Review migration files for any syntax errors
4. Check that all environment variables are set correctly

---

## Summary

After running these migrations, your system will have:

✅ **Doctor-patient assignment system**
✅ **Doctor profile management**
✅ **Notification preferences per doctor**
✅ **Automated alert reminders every 30 minutes**
✅ **Proper email routing to assigned doctors**
✅ **Multi-doctor support for patients**

All clinical alerts will now be sent to the correct doctor based on patient assignments!
