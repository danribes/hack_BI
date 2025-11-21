# Running Migration 020 on Render

This guide walks you through removing the 200 unclassified patients from your Render PostgreSQL database.

## Quick Start (5 minutes)

### Prerequisites
- Access to your Render dashboard
- Node.js installed (already available if you're running the backend)
- Your project cloned locally

**Note:** This guide uses a Node.js script that works in all environments (Codespaces, local, CI/CD). No need to install `psql`!

### Step-by-Step Instructions

#### 1. Get Your Database URL from Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click on your database service (e.g., `ckd-analyzer-db`)
3. Scroll down to the **Connections** section
4. Copy the **External Database URL**
   - It looks like: `postgresql://user:password@host/database`
   - Example: `postgresql://ckd_analyzer_user:XxXxX...@dpg-abc123.oregon-postgres.render.com/ckd_analyzer`

#### 2. Run the Migration

**Option A: Using Node.js (Recommended - works everywhere)**

```bash
node scripts/run_migration_020.js 'postgresql://YOUR_DATABASE_URL_HERE'
```

**Option B: Using bash script (requires psql installed)**

```bash
./scripts/run_migration_020_render.sh 'postgresql://YOUR_DATABASE_URL_HERE'
```

**Example:**
```bash
node scripts/run_migration_020.js 'postgresql://ckd_analyzer_user:pass123@dpg-abc123.oregon-postgres.render.com/ckd_analyzer'
```

#### 3. Confirm the Migration

The script will show you:
- Current state (1200 patients, 200 unclassified)
- Ask for confirmation
- Run the migration
- Show final state (1000 patients, 0 unclassified)

**Sample Output:**
```
📊 Current Database State:
   Total patients:        1200
   CKD patients:          587
   Non-CKD patients:      413
   Unclassified patients: 200

⚠️  WARNING: This will permanently delete 200 unclassified patients!

Do you want to proceed? (yes/no): yes

🚀 Running migration...
✅ Migration completed successfully!

📊 Final Database State:
   Total patients:        1000 (was 1200)
   CKD patients:          587
   Non-CKD patients:      413
   Unclassified patients: 0 (was 200)
```

## What This Migration Does

### Problem
Your UI showed inconsistent patient counts:
- **Header:** "Total: 1200 patients"
- **CKD:** 587 patients
- **Non-CKD:** 413 patients
- **587 + 413 = 1000** ≠ 1200 😵

### Solution
The migration:
1. Finds patients without classification data
2. Deletes them from the database
3. All related records are automatically deleted (observations, conditions, etc.)
4. Verifies the result matches expectations

### After Migration
- **Total patients:** 1000
- **CKD patients:** 587
- **Non-CKD patients:** 413
- **587 + 413 = 1000** ✅

## Troubleshooting

### "Cannot connect to database"
- Check that your DATABASE_URL is correct
- Ensure you copied the **External Database URL** (not Internal)
- Check that your database is running on Render

### "psql: command not found"
- Use the Node.js script instead: `node scripts/run_migration_020.js 'postgresql://...'`
- The Node.js script doesn't require psql to be installed

### "Migration already applied"
- The migration is idempotent and safe to run multiple times
- If no unclassified patients exist, it will report success immediately

### Need to Rollback?
This migration is **not reversible** as it permanently deletes data.

If you need to restore:
1. Restore from a database backup (if available)
2. Or re-run your database initialization scripts

## Alternative: Using Render Shell

If you prefer, you can also connect to your database through Render's web shell:

1. Go to your database on Render dashboard
2. Click the **Connect** button
3. Select **Web Shell**
4. Copy and paste the contents of `infrastructure/postgres/migrations/020_remove_unclassified_patients.sql`

## After Migration

Once the migration completes:

1. **Restart your backend service** on Render (optional, but recommended)
   - Go to your backend service
   - Click **Manual Deploy** → **Deploy latest commit**

2. **Verify in the UI**
   - Visit your app
   - Check that the patient counts now match:
     - Total: 1000
     - CKD: 587
     - Non-CKD: 413

## Need Help?

If you encounter issues:
1. Check the migration logs for error messages
2. Verify your database connection works: `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM patients;"`
3. Review the migration file: `infrastructure/postgres/migrations/020_remove_unclassified_patients.sql`

## Files Involved

- **Migration SQL:** `infrastructure/postgres/migrations/020_remove_unclassified_patients.sql`
- **Render Script:** `scripts/run_migration_020_render.sh`
- **Backend Fix:** `backend/src/api/routes/patients.ts` (lines 838-840)
- **Documentation:** `infrastructure/postgres/migrations/README_020.md`
