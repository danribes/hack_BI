# Step-by-Step Guide: Using the Doctor Assignment Interface

This guide shows you how to use the new visual interface to assign doctors to patient categories.

## Prerequisites

✅ **Before you start, make sure:**
1. Migrations 021-022 are completed
2. Backend service has been restarted on Render
3. Frontend is running and accessible

---

## Step 1: Access the Doctor Assignment Interface

### 1.1 Open Your Application

Go to your frontend URL:
```
https://ckd-analyzer-frontend.onrender.com
```
(Or your local development URL: `http://localhost:8080`)

### 1.2 Click "Manage Doctors" Button

Look for the **"Manage Doctors"** button in the top-right corner of the header.

**What you'll see:**
- A purple/indigo button with a user group icon
- Located in the header, right side
- Next to the "RenalGuard AI" title

**Click the button** → The Doctor Assignment modal will open

---

## Step 2: Add Your First Doctor

The interface opens with three main sections:
1. **Add New Doctor** (blue section at top)
2. **Available Doctors** (gray cards in middle)
3. **Category Assignments** (two sections below)

### 2.1 Fill in Doctor Information

In the blue "Add New Doctor" section, enter:

**Field 1: Email** (Required)
```
Example: dr.smith@hospital.com
```

**Field 2: Full Name** (Required)
```
Example: Dr. Sarah Smith
```

**Field 3: Specialty** (Optional)
```
Example: Nephrology
```

### 2.2 Click "Add Doctor"

**What happens:**
- ✅ Doctor is saved to the database
- ✅ New card appears in "Available Doctors" section
- ✅ Doctor appears in dropdown menus for categories
- ✅ Green success message shows at top

### 2.3 Add More Doctors (Repeat as Needed)

**Example: Add 3 doctors for different specialties**

**Doctor 1 - General Nephrology:**
- Email: `dr.smith@hospital.com`
- Name: `Dr. Sarah Smith`
- Specialty: `Nephrology`

**Doctor 2 - Advanced CKD:**
- Email: `dr.jones@hospital.com`
- Name: `Dr. Michael Jones`
- Specialty: `Advanced Nephrology`

**Doctor 3 - Dialysis Specialist:**
- Email: `dr.brown@hospital.com`
- Name: `Dr. Lisa Brown`
- Specialty: `Dialysis & Transplant`

Click **"Add Doctor"** after each one.

---

## Step 3: Review Patient Categories

Scroll down to see the **category assignment sections**.

### 3.1 Non-CKD Patients Section (Gray Background)

You'll see three categories with patient counts:

```
Non-CKD Low Risk          [Select Doctor ▼]
120 patients

Non-CKD Moderate Risk     [Select Doctor ▼]
180 patients

Non-CKD High Risk         [Select Doctor ▼]
113 patients
```

### 3.2 CKD Patients Section (Orange Background)

You'll see four categories with patient counts:

```
CKD Mild                  [Select Doctor ▼]
150 patients

CKD Moderate              [Select Doctor ▼]
200 patients

CKD Severe                [Select Doctor ▼]
187 patients

CKD Kidney Failure        [Select Doctor ▼]
50 patients
```

**Note:** Patient counts are real-time from your database!

---

## Step 4: Assign Doctors to Categories

For each category, click the dropdown and select a doctor.

### 4.1 Recommended Assignment Strategy

**For a Single Doctor:**
If you only have one doctor (e.g., yourself), assign to ALL categories:

```
✓ Non-CKD Low Risk        → Dr. Sarah Smith
✓ Non-CKD Moderate Risk   → Dr. Sarah Smith
✓ Non-CKD High Risk       → Dr. Sarah Smith
✓ CKD Mild                → Dr. Sarah Smith
✓ CKD Moderate            → Dr. Sarah Smith
✓ CKD Severe              → Dr. Sarah Smith
✓ CKD Kidney Failure      → Dr. Sarah Smith
```

**For Multiple Doctors (Recommended):**
Distribute by severity/specialization:

```
✓ Non-CKD Low Risk        → Dr. Sarah Smith (General)
✓ Non-CKD Moderate Risk   → Dr. Sarah Smith (General)
✓ Non-CKD High Risk       → Dr. Michael Jones (Specialist)
✓ CKD Mild                → Dr. Sarah Smith (General)
✓ CKD Moderate            → Dr. Michael Jones (Specialist)
✓ CKD Severe              → Dr. Michael Jones (Specialist)
✓ CKD Kidney Failure      → Dr. Lisa Brown (Dialysis)
```

### 4.2 How to Select

1. **Click the dropdown** for a category
2. **Select a doctor** from the list
3. The dropdown will show the selected doctor's name
4. **Repeat** for each category you want to assign

**Tips:**
- You can leave categories unassigned (they'll keep default doctor)
- You can assign the same doctor to multiple categories
- You can assign different doctors to different categories

---

## Step 5: Save Your Assignments

### 5.1 Click "Save Assignments" Button

Located at the bottom-right of the modal (green button).

**Before clicking:**
- Make sure you've selected at least one doctor for at least one category
- Review your selections

**Click the button** → The system will:
1. Show loading spinner: "Saving..."
2. Process all assignments in the background
3. Assign ALL patients in each category to their selected doctor

### 5.2 Wait for Confirmation

**Processing time:** 5-30 seconds depending on patient count

**What's happening:**
- Backend is querying patients for each category
- Backend is updating doctor assignments in batches
- Database is being updated with new assignments

### 5.3 Success!

You'll see a green success message:

```
✅ Successfully assigned 1000 patients to 7 categories!
```

**Details shown:**
- Total number of patients assigned
- Number of categories processed

---

## Step 6: Verify Your Assignments

### 6.1 Close the Modal

Click the **X** button (top-right) or **Cancel** button to close.

### 6.2 Verify in Database (Optional)

If you want to double-check, you can query the database:

```bash
# Using your DATABASE_URL
psql "postgresql://..." -c "
  SELECT doctor_email, COUNT(*) as patient_count
  FROM doctor_patient_assignments
  GROUP BY doctor_email
  ORDER BY patient_count DESC;
"
```

**Expected output:**
```
     doctor_email      | patient_count
-----------------------+--------------
 dr.smith@hospital.com |           463
 dr.jones@hospital.com |           387
 dr.brown@hospital.com |           150
```

### 6.3 Test Email Routing

The best way to verify is to trigger a test alert:

1. Go to a patient detail page
2. Click "Update Patient Records"
3. If the patient's values trigger an alert, check that the email goes to the correct doctor

---

## Step 7: Update Assignments Later (If Needed)

### 7.1 Re-open the Interface

Click **"Manage Doctors"** button again

### 7.2 Your Changes Are Saved

- All doctors you added are still there
- You can add more doctors
- You can change category assignments

### 7.3 Modify Assignments

1. Change the dropdown selections
2. Click **"Save Assignments"** again
3. The system will **overwrite** previous assignments for those categories

**Important:**
- Only selected categories are updated
- If you don't select a doctor for a category, that category keeps its current assignments

---

## Complete Example Workflow

### Scenario: Hospital with 3 Nephrologists

**Step 1:** Open interface → Click "Manage Doctors"

**Step 2:** Add doctors:

```
Doctor 1:
- Email: sarah.smith@hospital.com
- Name: Dr. Sarah Smith
- Specialty: General Nephrology
[Add Doctor]

Doctor 2:
- Email: michael.jones@hospital.com
- Name: Dr. Michael Jones
- Specialty: Advanced CKD
[Add Doctor]

Doctor 3:
- Email: lisa.brown@hospital.com
- Name: Dr. Lisa Brown
- Specialty: Dialysis
[Add Doctor]
```

**Step 3:** Assign categories:

```
Non-CKD Section:
├─ Low Risk (120 patients)        → Dr. Sarah Smith
├─ Moderate Risk (180 patients)   → Dr. Sarah Smith
└─ High Risk (113 patients)       → Dr. Michael Jones

CKD Section:
├─ Mild (150 patients)            → Dr. Sarah Smith
├─ Moderate (200 patients)        → Dr. Michael Jones
├─ Severe (187 patients)          → Dr. Michael Jones
└─ Kidney Failure (50 patients)   → Dr. Lisa Brown
```

**Step 4:** Click "Save Assignments"

**Result:**
```
✅ Successfully assigned 1000 patients to 7 categories!

Breakdown:
- Dr. Sarah Smith:    450 patients (Low-risk cases)
- Dr. Michael Jones:  500 patients (Moderate-severe cases)
- Dr. Lisa Brown:      50 patients (Dialysis cases)
```

**Step 5:** Close modal → Done!

---

## Troubleshooting

### Error: "Email and name are required"

**Problem:** You tried to add a doctor without filling required fields

**Solution:**
- Fill in both Email and Full Name
- Specialty is optional

---

### Error: "Please assign at least one doctor to a category"

**Problem:** You clicked Save without selecting any doctors

**Solution:**
- Select at least one doctor from the dropdowns
- Make sure the dropdown shows the doctor's name (not "Select Doctor...")

---

### No doctors in dropdown

**Problem:** Dropdowns are empty or show only "Select Doctor..."

**Solution:**
- Add doctors first using the blue "Add New Doctor" section
- Refresh the page if doctors aren't showing

---

### Assignment didn't save

**Problem:** Clicked save but patients still have old assignments

**Solution:**
1. Check for error message at top of modal
2. Verify backend service is running on Render
3. Check browser console for errors (F12 → Console tab)
4. Try again - make sure you see the success message

---

### Want to unassign all patients

**Problem:** Want to remove all doctor assignments

**Solution:**
- Currently, you need to assign a default doctor
- Or manually delete from database:
  ```sql
  DELETE FROM doctor_patient_assignments WHERE doctor_email = 'unwanted@email.com';
  ```

---

## Quick Reference

| Step | Action | Location |
|------|--------|----------|
| 1 | Open interface | Click "Manage Doctors" button (top-right header) |
| 2 | Add doctor | Fill email + name → Click "Add Doctor" |
| 3 | View categories | Scroll down to see patient counts |
| 4 | Assign categories | Click dropdown → Select doctor |
| 5 | Save | Click "Save Assignments" (bottom-right) |
| 6 | Verify | Check success message → Close modal |

---

## What Happens After Assignment?

### Immediate Effects:

✅ **Database Updated**
- All patients in each category now have assigned doctor
- Primary doctor flag set to `true`
- Assignment timestamp recorded

✅ **Email Routing Active**
- All future alerts for those patients go to assigned doctor
- Clinical alerts (worsening trends, deterioration, adherence)
- AI-generated alerts
- Health state transition emails

✅ **Alert Reminder Service**
- Monitors for unacknowledged CRITICAL alerts
- Sends reminders to assigned doctor (every 30 min check)
- Tracks retry count per doctor

### What Gets Sent to Assigned Doctors:

**Alert Type 1: Worsening Trends**
- eGFR decline >10% or uACR increase >25%
- Priority: HIGH
- Sent to: Assigned doctor for that patient

**Alert Type 2: Health State Deterioration**
- CKD stage progression (G3a→G3b, etc.)
- Priority: CRITICAL
- Sent to: Assigned doctor for that patient

**Alert Type 3: Poor Medication Adherence**
- Adherence score <75%
- Priority: HIGH
- Sent to: Assigned doctor for that patient

**Alert Type 4: Minuteful Kidney Worsening**
- Home monitoring uACR increase >30%
- Priority: CRITICAL
- Sent to: Assigned doctor for that patient

---

## Tips for Success

### Best Practices:

1. **Start with yourself**
   - Add your email as a doctor first
   - Assign yourself to all categories initially
   - Test the system with your own email

2. **Add team gradually**
   - Once working, add other doctors
   - Reassign categories as needed
   - Monitor that alerts go to correct doctors

3. **Organize by severity**
   - General practitioners: Low-risk categories
   - Nephrologists: Moderate-severe CKD
   - Specialists: Kidney failure, dialysis

4. **Document your assignments**
   - Keep a note of which doctor handles which category
   - Useful for team coordination
   - Helps during doctor vacation/absence

5. **Update as needed**
   - Interface can be reopened anytime
   - Assignments can be changed
   - Takes effect immediately

---

## Next Steps

After assigning doctors:

1. ✅ **Configure Email Settings**
   - Ensure SMTP is set up: `POST /api/settings/email`
   - Test email delivery works

2. ✅ **Set Doctor Preferences** (Optional)
   - Update notification preferences per doctor
   - Set quiet hours
   - Configure alert priorities

3. ✅ **Monitor Alerts**
   - Check that alerts are being sent
   - Verify doctors receive emails
   - Monitor acknowledgment rates

4. ✅ **Review Regularly**
   - Reassign as team changes
   - Adjust based on workload
   - Update doctor information as needed

---

## Summary

You now know how to:
- ✅ Access the Doctor Assignment interface
- ✅ Add doctors to the system
- ✅ View patient categories and counts
- ✅ Assign doctors to categories
- ✅ Save bulk assignments
- ✅ Verify and update assignments
- ✅ Troubleshoot common issues

**Result:** All 1000 patients can be assigned to appropriate doctors in less than 5 minutes!

The visual interface eliminates the need for API calls, scripts, or command-line tools. Everything is point-and-click! 🎉
