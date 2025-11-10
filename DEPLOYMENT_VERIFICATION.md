# Deployment Verification & Troubleshooting Guide

## Issues Fixed (Latest)

### ✅ Build Errors Fixed

1. **Frontend TypeScript Error** (Fixed in commit `caba6fc`)
   - **Issue**: Unused `getSeverityIcon` function in `UACRMonitoringDashboard.tsx`
   - **Error**: `TS6133: 'getSeverityIcon' is declared but its value is never read`
   - **Fix**: Removed unused function and `Activity` import
   - **Status**: ✅ Frontend builds successfully

2. **Render.yaml Configuration** (Fixed in commit `dad507a`)
   - **Issue**: Frontend build path configuration was incorrect
   - **Problem**: Used `cd frontend` without `rootDir` setting
   - **Fix**: Added `rootDir: frontend` and updated paths to be relative
   - **Status**: ✅ Configuration optimized for Render

### ✅ Previous Fixes

3. **Backend TypeScript Errors** (Fixed in commit `25ae072`)
   - Added missing type properties to interfaces
   - Fixed type compatibility issues
   - **Status**: ✅ Backend builds successfully

---

## Pre-Deployment Checklist

### Build Verification

Run these commands to verify builds work locally:

```bash
# Backend build
cd backend && npm run build
# Expected: No errors, dist/ folder created

# Frontend build
cd frontend && npm run build
# Expected: No errors, dist/ folder created with assets
```

**Status**: ✅ Both builds successful (verified)

---

## Common Deployment Issues & Solutions

### Issue 1: Frontend Build Fails on Render

**Symptoms:**
- Build fails with TypeScript errors
- Error mentions unused variables or functions

**Solution:**
✅ Fixed in commit `caba6fc` - removed unused code

**Verification:**
```bash
cd frontend && npm run build
# Should complete without errors
```

---

### Issue 2: Backend Build Fails

**Symptoms:**
- TypeScript compilation errors
- Missing type definitions

**Solution:**
✅ Fixed in commit `25ae072` - all type definitions corrected

**Verification:**
```bash
cd backend && npm run build
# Should complete without errors
```

---

### Issue 3: Database Connection Fails

**Symptoms:**
- Backend starts but returns 500 errors
- `/api/db/health` returns error
- Logs show "Database connection failed"

**Possible Causes:**
1. DATABASE_URL not set correctly
2. Database not initialized with schema
3. SSL configuration issues

**Solutions:**

#### A. Check DATABASE_URL Environment Variable
In Render dashboard → Backend service → Environment:
- Verify `DATABASE_URL` is set to the Internal Database URL
- Should look like: `postgresql://postgres:...@dpg-.../ckd_analyzer`
- Must use **Internal** URL, not External

#### B. Initialize Database Schema
```bash
# Connect to database using Render's Shell tab or locally:
psql $DATABASE_URL

# Run initialization script:
\i infrastructure/postgres/init.sql

# Run migrations in order:
\i infrastructure/postgres/migrations/001_add_enhanced_patient_fields.sql
\i infrastructure/postgres/migrations/002_add_200_mock_patients.sql
\i infrastructure/postgres/migrations/003_add_monitoring_triggers.sql
\i infrastructure/postgres/migrations/004_add_ckd_diagnosis_detection.sql

# Verify data:
SELECT COUNT(*) FROM patients;  -- Should return ~200
```

#### C. SSL Configuration
Backend already configured for Render's SSL requirements in `backend/src/config/database.ts`:
```typescript
ssl: {
  rejectUnauthorized: false,
}
```

---

### Issue 4: Frontend Can't Connect to Backend

**Symptoms:**
- Frontend loads but shows "Failed to fetch" errors
- API calls return CORS errors
- Network tab shows requests to wrong URL

**Possible Causes:**
1. VITE_API_URL not set correctly
2. CORS_ORIGIN not configured in backend
3. Backend not deployed or unhealthy

**Solutions:**

#### A. Check Frontend Environment Variables
In Render dashboard → Frontend service → Environment:
- `VITE_API_URL` should be: `https://ckd-analyzer-backend.onrender.com`
- This is already set in render.yaml

#### B. Check Backend CORS Configuration
In Render dashboard → Backend service → Environment:
- `CORS_ORIGIN` should be: `https://ckd-analyzer-frontend.onrender.com`
- This is already set in render.yaml

#### C. Verify Backend Health
```bash
curl https://ckd-analyzer-backend.onrender.com/health
# Should return: {"status":"ok",...}
```

---

### Issue 5: Backend Health Check Fails

**Symptoms:**
- Render shows "Deploy failed - Health check timeout"
- Backend logs show it's starting but Render marks it unhealthy

**Possible Causes:**
1. Health endpoint not accessible
2. App not listening on correct port
3. Database connection blocking startup

**Solutions:**

#### A. Verify Health Endpoint
Backend has health endpoint at `/health` (defined in `backend/src/index.ts:35`)

#### B. Check PORT Configuration
Backend uses: `const PORT = process.env.PORT || 3000;`
Render sets PORT automatically - no manual configuration needed

#### C. Non-Blocking Database Connection
Backend should start even if database fails initially. Check logs for:
```
✅ Database connection successful
```
or
```
❌ Database connection failed
```

---

### Issue 6: Static Site 404 Errors

**Symptoms:**
- Frontend root loads but routes show 404
- Refresh on any route returns 404

**Solution:**
For Render static sites with client-side routing, you may need to configure redirects.

**Check:** Does `frontend/public` have a `_redirects` file?

If not, create `/home/user/hackathon_BI_CKD/frontend/public/_redirects`:
```
/*    /index.html   200
```

This tells Render to serve index.html for all routes (SPA routing).

---

### Issue 7: Missing Environment Variables

**Symptoms:**
- Backend crashes with "ANTHROPIC_API_KEY is not defined"
- Features don't work properly

**Required Environment Variables:**

**Backend:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<from_render_database>
DB_POOL_MAX=10
CLAUDE_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=<your_key>  # ⚠️ MUST BE SET MANUALLY
CORS_ORIGIN=https://ckd-analyzer-frontend.onrender.com
```

**Frontend:**
```bash
VITE_API_URL=https://ckd-analyzer-backend.onrender.com
```

⚠️ **CRITICAL**: `ANTHROPIC_API_KEY` must be set manually in Render dashboard
- Go to Backend service → Environment → Add Environment Variable
- Key: `ANTHROPIC_API_KEY`
- Value: Your API key from https://console.anthropic.com

---

## Deployment Steps (If Starting Fresh)

### 1. Create PostgreSQL Database
- Go to https://dashboard.render.com
- New + → PostgreSQL
- Name: `ckd-analyzer-db`
- Plan: Free
- Copy **Internal Database URL**

### 2. Deploy Backend
- New + → Web Service
- Connect GitHub repo
- Root Directory: `backend`
- Runtime: Docker
- Add all environment variables (see above)
- Deploy

### 3. Initialize Database
Use Render's Shell tab or connect locally:
```bash
psql <INTERNAL_DATABASE_URL>
\i infrastructure/postgres/init.sql
\i infrastructure/postgres/migrations/001_add_enhanced_patient_fields.sql
\i infrastructure/postgres/migrations/002_add_200_mock_patients.sql
\i infrastructure/postgres/migrations/003_add_monitoring_triggers.sql
\i infrastructure/postgres/migrations/004_add_ckd_diagnosis_detection.sql
```

### 4. Deploy Frontend
- New + → Static Site
- Connect GitHub repo
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Add environment variable: `VITE_API_URL=https://ckd-analyzer-backend.onrender.com`

---

## Quick Diagnostics

### Backend Health Check
```bash
curl https://ckd-analyzer-backend.onrender.com/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "Healthcare AI Backend",
  "version": "1.0.0"
}
```

### Database Health Check
```bash
curl https://ckd-analyzer-backend.onrender.com/api/db/health
```
Expected response:
```json
{
  "status": "ok",
  "message": "Database connection successful",
  "database": {...}
}
```

### Frontend Loading
```bash
curl https://ckd-analyzer-frontend.onrender.com
```
Should return HTML with `<div id="root">`

---

## Logs Locations

**Render Dashboard:**
- Backend Logs: Backend service → Logs tab
- Frontend Logs: Frontend service → Logs tab (build logs)
- Database Logs: Database → Logs tab

**What to Look For:**

Backend startup logs should show:
```
✅ Database connection successful
✅ Health check: http://localhost:3000/health
[RiskChangeMonitor] ✓ Listening to channels: patient_data_updated
```

---

## Next Steps

If deployment is still failing:

1. **Check Render Dashboard Logs**
   - Go to the failed service
   - Click "Logs" tab
   - Look for specific error messages

2. **Verify All Environment Variables**
   - Backend service → Environment → Verify all vars are set
   - Especially `ANTHROPIC_API_KEY` (must be set manually)

3. **Test Locally with Production Settings**
   ```bash
   # Backend
   cd backend
   DATABASE_URL="<your_render_db_url>" npm start

   # Frontend
   cd frontend
   VITE_API_URL="https://ckd-analyzer-backend.onrender.com" npm run build
   ```

4. **Share Specific Error**
   - Copy exact error message from Render logs
   - Include which service is failing (backend/frontend/database)
   - Include timestamp of failure

---

## Status Summary

✅ **Build Verification**: Both backend and frontend build successfully
✅ **Type Safety**: All TypeScript errors fixed
✅ **Configuration**: render.yaml properly configured
✅ **Database**: Schema and migrations ready
✅ **Documentation**: Deployment guide available in `docs/deployment/`

**Ready for deployment!**

If you're still experiencing issues, please provide:
1. Which service is failing (backend/frontend/database)
2. The specific error message from Render logs
3. Screenshot of the error if possible
