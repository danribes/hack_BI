# Step-by-Step Guide: Assigning Doctors to Patients

This guide shows you how to assign doctors to patients using the new API endpoints after running migrations 021-022.

## Prerequisites

- ✅ Migrations 021-022 completed
- ✅ Backend service restarted on Render
- ✅ Your backend API URL (e.g., `https://ckd-analyzer-backend.onrender.com`)

## Method 1: Using curl (Command Line)

### Step 1: Find Your Patient IDs

First, get a list of patients to find their IDs:

```bash
# Get all patients
curl https://your-backend.onrender.com/api/patients

# Or get a specific patient by search
curl https://your-backend.onrender.com/api/patients?search=John
```

**Response example:**
```json
{
  "status": "success",
  "patients": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "John",
      "last_name": "Doe",
      "medical_record_number": "MRN001",
      "email": "john.doe@email.com"
    }
  ]
}
```

**Copy the patient ID** (e.g., `550e8400-e29b-41d4-a716-446655440000`)

---

### Step 2: Create a Doctor Profile (Optional but Recommended)

Create a doctor profile in the system:

```bash
curl -X POST https://your-backend.onrender.com/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dr.smith@hospital.com",
    "name": "Dr. Sarah Smith",
    "specialty": "Nephrology",
    "phone": "555-0123",
    "notification_preferences": {
      "critical_via": "email",
      "high_via": "email",
      "moderate_via": "email",
      "quiet_hours_enabled": false
    }
  }'
```

**Response:**
```json
{
  "status": "success",
  "doctor": {
    "id": "abc-123-def-456",
    "email": "dr.smith@hospital.com",
    "name": "Dr. Sarah Smith",
    "specialty": "Nephrology",
    "phone": "555-0123"
  }
}
```

---

### Step 3: Assign Doctor to Patient

Use the patient ID from Step 1:

```bash
curl -X POST https://your-backend.onrender.com/api/patients/550e8400-e29b-41d4-a716-446655440000/assign-doctor \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_email": "dr.smith@hospital.com",
    "doctor_name": "Dr. Sarah Smith",
    "is_primary": true
  }'
```

**Response:**
```json
{
  "status": "success",
  "assignment": {
    "id": "assignment-uuid",
    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
    "doctor_email": "dr.smith@hospital.com",
    "doctor_name": "Dr. Sarah Smith",
    "is_primary": true,
    "assigned_at": "2025-11-23T10:30:00Z"
  }
}
```

---

### Step 4: Verify the Assignment

Check that the doctor was assigned:

```bash
# Get primary doctor for the patient
curl https://your-backend.onrender.com/api/patients/550e8400-e29b-41d4-a716-446655440000/primary-doctor

# Or get all doctors for the patient
curl https://your-backend.onrender.com/api/patients/550e8400-e29b-41d4-a716-446655440000/doctors
```

**Response:**
```json
{
  "status": "success",
  "doctor": {
    "doctor_email": "dr.smith@hospital.com",
    "doctor_name": "Dr. Sarah Smith",
    "is_primary": true,
    "notification_preferences": {
      "critical_via": "email",
      "high_via": "email"
    }
  }
}
```

✅ **Success!** The patient is now assigned to Dr. Smith. All alerts for this patient will be sent to `dr.smith@hospital.com`.

---

## Method 2: Using Postman (Visual Interface)

### Step 1: Import the API Collection

1. Open Postman
2. Create a new request
3. Set your backend URL as a variable: `{{BASE_URL}}` = `https://your-backend.onrender.com`

### Step 2: Get Patients

**Request:**
- Method: `GET`
- URL: `{{BASE_URL}}/api/patients`

**Send** → Copy a patient ID from the response

### Step 3: Create Doctor

**Request:**
- Method: `POST`
- URL: `{{BASE_URL}}/api/doctors`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "email": "dr.smith@hospital.com",
  "name": "Dr. Sarah Smith",
  "specialty": "Nephrology",
  "phone": "555-0123"
}
```

### Step 4: Assign Doctor to Patient

**Request:**
- Method: `POST`
- URL: `{{BASE_URL}}/api/patients/YOUR_PATIENT_ID/assign-doctor`
  - Replace `YOUR_PATIENT_ID` with actual ID
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "doctor_email": "dr.smith@hospital.com",
  "doctor_name": "Dr. Sarah Smith",
  "is_primary": true
}
```

### Step 5: Verify

**Request:**
- Method: `GET`
- URL: `{{BASE_URL}}/api/patients/YOUR_PATIENT_ID/primary-doctor`

---

## Method 3: Bulk Assignment Script (Assign One Doctor to Many Patients)

If you want to assign the same doctor to multiple patients, use this Node.js script:

### Create `assign_doctor_bulk.js`:

```javascript
#!/usr/bin/env node
const API_URL = process.env.API_URL || 'https://your-backend.onrender.com';
const DOCTOR_EMAIL = process.argv[2];
const DOCTOR_NAME = process.argv[3];

if (!DOCTOR_EMAIL || !DOCTOR_NAME) {
  console.error('Usage: node assign_doctor_bulk.js <doctor-email> <doctor-name>');
  console.error('Example: node assign_doctor_bulk.js "dr.smith@hospital.com" "Dr. Sarah Smith"');
  process.exit(1);
}

async function assignDoctorToAllPatients() {
  console.log('🏥 Bulk Doctor Assignment');
  console.log(`📧 Doctor: ${DOCTOR_NAME} (${DOCTOR_EMAIL})\n`);

  // Step 1: Get all patients
  console.log('Fetching all patients...');
  const patientsResponse = await fetch(`${API_URL}/api/patients`);
  const patientsData = await patientsResponse.json();

  if (patientsData.status !== 'success') {
    console.error('❌ Failed to fetch patients');
    process.exit(1);
  }

  const patients = patientsData.patients;
  console.log(`✓ Found ${patients.length} patients\n`);

  // Step 2: Assign doctor to each patient
  let successCount = 0;
  let errorCount = 0;

  for (const patient of patients) {
    try {
      const response = await fetch(
        `${API_URL}/api/patients/${patient.id}/assign-doctor`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_email: DOCTOR_EMAIL,
            doctor_name: DOCTOR_NAME,
            is_primary: true
          })
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        console.log(`✓ Assigned to ${patient.first_name} ${patient.last_name} (${patient.medical_record_number})`);
        successCount++;
      } else {
        console.error(`✗ Failed for ${patient.medical_record_number}: ${data.message}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`✗ Error for ${patient.medical_record_number}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✓ Success: ${successCount}`);
  console.log(`   ✗ Errors: ${errorCount}`);
  console.log(`   Total: ${patients.length}`);
}

assignDoctorToAllPatients();
```

### Run the bulk assignment:

```bash
# Make it executable
chmod +x assign_doctor_bulk.js

# Run it
node assign_doctor_bulk.js "dr.smith@hospital.com" "Dr. Sarah Smith"
```

**Output:**
```
🏥 Bulk Doctor Assignment
📧 Doctor: Dr. Sarah Smith (dr.smith@hospital.com)

Fetching all patients...
✓ Found 1000 patients

✓ Assigned to John Doe (MRN001)
✓ Assigned to Jane Smith (MRN002)
✓ Assigned to Robert Johnson (MRN003)
...

📊 Summary:
   ✓ Success: 1000
   ✗ Errors: 0
   Total: 1000
```

---

## Method 4: Using Python Script

### Create `assign_doctor.py`:

```python
#!/usr/bin/env python3
import requests
import sys

API_URL = "https://your-backend.onrender.com"

def assign_doctor(patient_id, doctor_email, doctor_name):
    """Assign a doctor to a specific patient"""

    url = f"{API_URL}/api/patients/{patient_id}/assign-doctor"

    payload = {
        "doctor_email": doctor_email,
        "doctor_name": doctor_name,
        "is_primary": True
    }

    response = requests.post(url, json=payload)
    data = response.json()

    if data.get("status") == "success":
        print(f"✓ Successfully assigned {doctor_name} to patient {patient_id}")
        return True
    else:
        print(f"✗ Failed: {data.get('message', 'Unknown error')}")
        return False

def get_all_patients():
    """Get all patients"""
    response = requests.get(f"{API_URL}/api/patients")
    data = response.json()
    return data.get("patients", [])

def bulk_assign(doctor_email, doctor_name):
    """Assign doctor to all patients"""
    patients = get_all_patients()
    print(f"Found {len(patients)} patients")

    success = 0
    for patient in patients:
        if assign_doctor(patient["id"], doctor_email, doctor_name):
            success += 1

    print(f"\nAssigned doctor to {success}/{len(patients)} patients")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python assign_doctor.py <doctor_email> <doctor_name>")
        sys.exit(1)

    doctor_email = sys.argv[1]
    doctor_name = sys.argv[2]

    bulk_assign(doctor_email, doctor_name)
```

### Run it:

```bash
python assign_doctor.py "dr.smith@hospital.com" "Dr. Sarah Smith"
```

---

## Common Workflows

### Scenario 1: Single Doctor for All Patients

**Goal:** Assign one doctor to all patients

**Steps:**
1. Create the doctor profile (if not exists)
2. Run bulk assignment script
3. Verify a few patient assignments

```bash
# Create doctor
curl -X POST https://your-backend.onrender.com/api/doctors \
  -H "Content-Type: application/json" \
  -d '{"email": "dr.smith@hospital.com", "name": "Dr. Sarah Smith", "specialty": "Nephrology"}'

# Bulk assign
node assign_doctor_bulk.js "dr.smith@hospital.com" "Dr. Sarah Smith"

# Verify
curl https://your-backend.onrender.com/api/patients/SOME_PATIENT_ID/primary-doctor
```

---

### Scenario 2: Multiple Doctors, Specific Patient Lists

**Goal:** Assign different doctors to different patient groups

**Example:** Dr. Smith for patients 1-500, Dr. Jones for patients 501-1000

```javascript
// Create assign_by_range.js
const API_URL = 'https://your-backend.onrender.com';

async function assignByRange(startIndex, endIndex, doctorEmail, doctorName) {
  const response = await fetch(`${API_URL}/api/patients`);
  const data = await response.json();
  const patients = data.patients.slice(startIndex, endIndex);

  for (const patient of patients) {
    await fetch(`${API_URL}/api/patients/${patient.id}/assign-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_email: doctorEmail,
        doctor_name: doctorName,
        is_primary: true
      })
    });
    console.log(`✓ ${patient.medical_record_number} → ${doctorName}`);
  }
}

// Assign first 500 to Dr. Smith
await assignByRange(0, 500, 'dr.smith@hospital.com', 'Dr. Sarah Smith');

// Assign next 500 to Dr. Jones
await assignByRange(500, 1000, 'dr.jones@hospital.com', 'Dr. Michael Jones');
```

---

### Scenario 3: Add Consulting Doctor (Multiple Doctors per Patient)

**Goal:** Patient has a primary doctor + consulting doctor

```bash
# Assign primary doctor
curl -X POST https://your-backend.onrender.com/api/patients/PATIENT_ID/assign-doctor \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_email": "dr.smith@hospital.com",
    "doctor_name": "Dr. Sarah Smith",
    "is_primary": true
  }'

# Assign consulting doctor (is_primary = false)
curl -X POST https://your-backend.onrender.com/api/patients/PATIENT_ID/assign-doctor \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_email": "dr.jones@hospital.com",
    "doctor_name": "Dr. Michael Jones",
    "is_primary": false
  }'

# Get all doctors for patient
curl https://your-backend.onrender.com/api/patients/PATIENT_ID/doctors
```

**Response:**
```json
{
  "status": "success",
  "doctors": [
    {
      "doctor_email": "dr.smith@hospital.com",
      "doctor_name": "Dr. Sarah Smith",
      "is_primary": true
    },
    {
      "doctor_email": "dr.jones@hospital.com",
      "doctor_name": "Dr. Michael Jones",
      "is_primary": false
    }
  ]
}
```

---

## Verification Steps

### 1. Check Total Assignments

```bash
# Using psql or database query
SELECT COUNT(*) FROM doctor_patient_assignments;
```

Expected: Should equal your total patient count (e.g., 1000)

### 2. Check Assignments by Doctor

```bash
# Query the database
SELECT doctor_email, COUNT(*) as patient_count
FROM doctor_patient_assignments
GROUP BY doctor_email;
```

### 3. Test Email Notifications

After assigning doctors, trigger a test alert to verify emails go to the correct doctor:

```bash
# Update a patient record to trigger an alert
# (This depends on your specific workflow)
```

---

## Troubleshooting

### Error: "Patient not found"
**Solution:** Verify the patient ID is correct. Patient IDs are UUIDs like `550e8400-e29b-41d4-a716-446655440000`

### Error: "Doctor already assigned"
**Solution:** This is actually fine! The assignment will be updated. The database has `ON CONFLICT` handling.

### Assignments not persisting
**Solution:** Check that migrations 021-022 ran successfully. Verify tables exist:
```sql
SELECT * FROM doctor_patient_assignments LIMIT 1;
SELECT * FROM doctors LIMIT 1;
```

### Emails still going to default doctor
**Solution:**
1. Verify assignment: `GET /api/patients/:id/primary-doctor`
2. Restart backend service on Render
3. Check backend logs for doctor lookup

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/doctors` | GET | List all doctors |
| `/api/doctors` | POST | Create doctor profile |
| `/api/doctors/:email` | GET | Get doctor by email |
| `/api/doctors/:email` | PUT | Update doctor |
| `/api/patients/:id/assign-doctor` | POST | Assign doctor to patient |
| `/api/patients/:id/doctors` | GET | Get all doctors for patient |
| `/api/patients/:id/primary-doctor` | GET | Get primary doctor |
| `/api/patients/:id/doctors/:email` | DELETE | Remove assignment |

---

## Next Steps

After assigning doctors:

1. ✅ **Configure Email Notifications**
   - POST `/api/settings/email` with SMTP settings

2. ✅ **Update Doctor Preferences**
   - PUT `/api/doctors/:email` to set notification preferences

3. ✅ **Test Alerts**
   - Trigger a test alert and verify it goes to the correct doctor

4. ✅ **Monitor Alert Reminders**
   - The system will automatically check every 30 minutes for unacknowledged CRITICAL alerts

---

## Summary

You've learned how to:
- ✅ Find patient IDs
- ✅ Create doctor profiles
- ✅ Assign doctors to patients (single and bulk)
- ✅ Verify assignments
- ✅ Handle multiple doctors per patient
- ✅ Troubleshoot common issues

All clinical alerts will now be sent to the assigned doctor's email address instead of the default `doctor@example.com`!
