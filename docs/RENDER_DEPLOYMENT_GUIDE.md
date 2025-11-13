# Render Deployment Guide - Patient Filtering System

## Overview

This guide explains how to use the comprehensive patient filtering system on your **Render-deployed** Healthcare AI application.

---

## 🌐 Accessing Your Application

### Your Render URLs

Render typically provides URLs in this format:

**Backend API:**
```
https://your-backend-name.onrender.com
```

**Frontend Web App:**
```
https://your-frontend-name.onrender.com
```

**Replace with your actual Render service names.**

---

## 🚀 Quick Start on Render

### Step 1: Generate Realistic Patient Data

Use the Render backend URL to populate your database with 1,000 patients:

```bash
# Clear existing patients (if any)
curl -X POST https://your-backend-name.onrender.com/api/init/clear-patients

# Generate 1000 patients with real-world distribution
curl -X POST https://your-backend-name.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Realistic patient cohort generated successfully",
  "patients_created": 1000,
  "distribution": {
    "Non-CKD Low/Moderate Risk": 245,
    "Non-CKD High Risk": 400,
    "Mild CKD": 80,
    "Moderate CKD": 250,
    "Severe CKD": 20,
    "Kidney Failure": 5
  }
}
```

This will take **30-60 seconds** on Render's free tier.

### Step 2: Access the Frontend

Open your frontend URL in a browser:
```
https://your-frontend-name.onrender.com
```

You should see:
- **Filter panel** at the top with patient statistics
- **Search bar** below the filters
- **Patient list** showing all 1,000 patients

---

## 🔧 Environment Variables on Render

### Backend Service

Ensure these environment variables are set in your Render backend service:

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | (Automatically set by Render Postgres) | Database connection |
| `PORT` | `3000` | Backend port (Render may override) |
| `NODE_ENV` | `production` | Environment mode |
| `CORS_ORIGIN` | `https://your-frontend-name.onrender.com` | Allow frontend requests |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For AI features (if used) |

**Important:** Update `CORS_ORIGIN` to match your actual frontend Render URL.

### Frontend Service

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `https://your-backend-name.onrender.com` | Backend API endpoint |

**Critical:** This must point to your Render backend URL.

---

## 🧪 Testing the Filtering System on Render

### Test 1: Verify Statistics Endpoint

```bash
curl https://your-backend-name.onrender.com/api/patients/statistics
```

**Expected Response:**
```json
{
  "status": "success",
  "statistics": {
    "total_patients": 1000,
    "ckd": {
      "total": 355,
      "mild": { "total": 80, "treated": 64, "not_treated": 16 },
      "moderate": { "total": 250, "treated": 200, "not_treated": 50 },
      "severe": { "total": 20, "treated": 18, "not_treated": 2 },
      "kidney_failure": { "total": 5, "treated": 5, "not_treated": 0 }
    },
    "non_ckd": {
      "total": 645,
      "low": { "total": 245, "monitored": 0, "not_monitored": 245 },
      "high": { "total": 400, "monitored": 240, "not_monitored": 160 }
    }
  }
}
```

### Test 2: Filter CKD Patients

```bash
curl "https://your-backend-name.onrender.com/api/patients/filter?has_ckd=true"
```

Should return 355 CKD patients.

### Test 3: Filter Moderate CKD, Not Treated

```bash
curl "https://your-backend-name.onrender.com/api/patients/filter?has_ckd=true&severity=moderate&is_treated=false"
```

Should return 50 patients.

### Test 4: Filter High Risk Non-CKD, Not Monitored

```bash
curl "https://your-backend-name.onrender.com/api/patients/filter?has_ckd=false&risk_level=high&is_monitored=false"
```

Should return 160 patients.

---

## 📱 Using the Frontend on Render

### Opening the Application

1. Navigate to: `https://your-frontend-name.onrender.com`
2. Wait for the page to load (may take 30-60 seconds on first visit if service is sleeping)
3. You should see the filter panel at the top

### Filter Panel Features

The filter panel displays:

```
┌─────────────────────────────────────────────────────────┐
│ Filter Patients              Total: 1000 patients       │
├─────────────────────────────────────────────────────────┤
│ Patient Type:                                           │
│ [All Patients (1000)] [CKD Patients (355)] [Non-CKD...]│
│                                                          │
│ (Additional filters appear based on selection)          │
└─────────────────────────────────────────────────────────┘
```

### Example Workflows

#### Workflow 1: Find Untreated Moderate CKD Patients

1. Click **"CKD Patients (355)"**
   - Page reloads, showing 355 patients
   - New filter options appear for severity

2. Click **"Moderate CKD (250)"**
   - Page reloads, showing 250 patients
   - New filter options appear for treatment status

3. Click **"Not Treated (50)"**
   - Page shows final 50 patients
   - These are moderate CKD patients without treatment

#### Workflow 2: Find High-Risk Non-CKD Patients Needing Monitoring

1. Click **"Non-CKD Patients (645)"**
2. Click **"High Risk (400)"**
3. Click **"Not Monitored (160)"**
   - Shows 160 patients who should be enrolled in monitoring programs

#### Workflow 3: Search Within Filtered Results

1. Apply any filter (e.g., Moderate CKD)
2. Use search bar to find specific patient by name
3. Results are filtered to both criteria

---

## 🔍 API Endpoints Reference

### Base URL
```
https://your-backend-name.onrender.com/api
```

### Get Statistics
```
GET /patients/statistics
```

Returns hierarchical patient counts for filter UI.

### Filter Patients
```
GET /patients/filter?[parameters]
```

**Query Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `has_ckd` | `true`, `false` | Filter by CKD status |
| `severity` | `mild`, `moderate`, `severe`, `kidney_failure` | CKD severity level |
| `is_treated` | `true`, `false` | Treatment status (CKD only) |
| `risk_level` | `low`, `moderate`, `high` | Risk level (non-CKD only) |
| `is_monitored` | `true`, `false` | Monitoring status |

**Examples:**

```bash
# All CKD patients
GET /patients/filter?has_ckd=true

# Moderate CKD, treated
GET /patients/filter?has_ckd=true&severity=moderate&is_treated=true

# High risk non-CKD, monitored
GET /patients/filter?has_ckd=false&risk_level=high&is_monitored=true
```

### Get All Patients
```
GET /patients
```

Returns all patients without filters.

### Get Patient Details
```
GET /patients/:id
```

Returns detailed information for a specific patient.

---

## 🐛 Troubleshooting on Render

### Issue 1: "Service Unavailable" or 404 Errors

**Cause:** Render services may sleep after 15 minutes of inactivity (free tier).

**Solution:**
1. Wait 30-60 seconds for service to wake up
2. Refresh the page
3. Try the request again

### Issue 2: CORS Errors in Browser Console

**Symptom:**
```
Access to fetch at 'https://backend.onrender.com/api/patients'
from origin 'https://frontend.onrender.com' has been blocked by CORS policy
```

**Solution:**
1. Go to Render dashboard → Backend service → Environment
2. Set `CORS_ORIGIN` to your frontend URL:
   ```
   CORS_ORIGIN=https://your-frontend-name.onrender.com
   ```
3. Redeploy backend service

### Issue 3: Filter Panel Not Loading

**Symptom:** No filter panel appears, just search bar.

**Possible Causes:**
1. **Statistics API failing** - Check backend logs
2. **Frontend can't reach backend** - Check `VITE_API_URL`
3. **Database empty** - Run populate endpoint

**Solution:**
```bash
# Check if backend is accessible
curl https://your-backend-name.onrender.com/api/patients/statistics

# If it fails, check Render logs:
# Render Dashboard → Backend Service → Logs
```

### Issue 4: "0 patients" in Statistics

**Cause:** Database not populated yet.

**Solution:**
```bash
curl -X POST https://your-backend-name.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'
```

### Issue 5: Slow Performance

**Cause:** Render free tier has limited resources.

**Solutions:**
1. **Reduce patient count** (generate 500 instead of 1000)
2. **Upgrade Render plan** for better performance
3. **Be patient** - first load after sleep takes 30-60 seconds

---

## 📊 Expected Performance on Render

### Free Tier

| Operation | Time |
|-----------|------|
| **Service wake-up** | 30-60 seconds |
| **Load patient list** | 2-5 seconds |
| **Apply filter** | 1-3 seconds |
| **Search** | <1 second |
| **Load patient detail** | 1-2 seconds |
| **Generate 1000 patients** | 30-90 seconds |

### Paid Tier

| Operation | Time |
|-----------|------|
| **Service wake-up** | 0 seconds (always on) |
| **Load patient list** | 0.5-1 second |
| **Apply filter** | 0.3-0.8 seconds |
| **Search** | <0.3 seconds |
| **Load patient detail** | 0.3-0.5 seconds |
| **Generate 1000 patients** | 15-30 seconds |

---

## 🔒 Security Considerations

### Environment Variables

**Never commit these to Git:**
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- Production credentials

**Always set via Render Dashboard:**
Render Dashboard → Service → Environment → Add Variable

### CORS Configuration

**Only allow your frontend domain:**
```javascript
// backend/src/index.ts or similar
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://your-frontend.onrender.com',
  credentials: true
}));
```

---

## 🚀 Deployment Checklist

### Before Deploying

- [ ] Set `VITE_API_URL` in frontend to Render backend URL
- [ ] Set `CORS_ORIGIN` in backend to Render frontend URL
- [ ] Verify `DATABASE_URL` is configured (Render does this automatically)
- [ ] Test locally with Render URLs before deploying

### After Deploying

- [ ] Wait for services to fully deploy (check Render dashboard)
- [ ] Test backend health: `curl https://backend.onrender.com/health`
- [ ] Populate database via API
- [ ] Test filter functionality
- [ ] Test search functionality
- [ ] Test patient detail view

---

## 📞 Getting Help

### Check Render Logs

**Backend Logs:**
```
Render Dashboard → Backend Service → Logs
```

Look for:
- Database connection errors
- CORS errors
- API request errors
- Unhandled exceptions

**Frontend Logs:**
```
Browser DevTools → Console
```

Look for:
- Network errors (fetch failed)
- CORS errors
- API response errors

### Common Log Messages

**Good:**
```
✓ Database populated with 1000 patients
✓ Risk scores calculated for all patients
Server listening on port 3000
```

**Bad:**
```
Error: connect ECONNREFUSED (database not accessible)
CORS error: Origin not allowed
Error: Failed to fetch patients
```

---

## 🎯 Demo Preparation on Render

### 1. Day Before Demo

```bash
# Populate database
curl -X POST https://your-backend-name.onrender.com/api/init/clear-patients
curl -X POST https://your-backend-name.onrender.com/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'

# Verify statistics
curl https://your-backend-name.onrender.com/api/patients/statistics
```

### 2. Morning of Demo

```bash
# Wake up services (so they're not sleeping during demo)
curl https://your-backend-name.onrender.com/api/patients/statistics
curl https://your-frontend-name.onrender.com/
```

Wait 1-2 minutes, then test:
```bash
# Should respond quickly now
curl https://your-backend-name.onrender.com/api/patients/filter?has_ckd=true
```

### 3. During Demo

**Have these URLs bookmarked:**
- Frontend: `https://your-frontend-name.onrender.com`
- API Stats: `https://your-backend-name.onrender.com/api/patients/statistics`

**Demo Flow:**
1. Open frontend (should already be warm)
2. Show filter panel with statistics
3. Demonstrate filtering (CKD → Moderate → Not Treated)
4. Show search within filtered results
5. Open patient detail view

**Pro Tip:** Keep the frontend open in a tab 5-10 minutes before demo to ensure services are awake.

---

## 🔗 Quick Reference

### Your Render Service URLs

**Update these with your actual Render URLs:**

```bash
# Backend
export BACKEND_URL="https://your-backend-name.onrender.com"

# Frontend
export FRONTEND_URL="https://your-frontend-name.onrender.com"
```

### Common Commands

```bash
# Populate database
curl -X POST $BACKEND_URL/api/init/populate-realistic-cohort \
  -H "Content-Type: application/json" \
  -d '{"patient_count": 1000}'

# Get statistics
curl $BACKEND_URL/api/patients/statistics

# Filter moderate CKD, not treated
curl "$BACKEND_URL/api/patients/filter?has_ckd=true&severity=moderate&is_treated=false"

# Wake up services
curl $BACKEND_URL/health
curl $FRONTEND_URL/
```

---

## 📝 Notes

1. **Free Tier Limitations:**
   - Services sleep after 15 minutes inactivity
   - Wake-up time: 30-60 seconds
   - Shared resources (slower performance)

2. **Render-Specific Features:**
   - Automatic SSL/HTTPS
   - Automatic DATABASE_URL configuration
   - Zero-downtime deploys
   - Built-in health checks

3. **Best Practices:**
   - Keep services warm before important demos
   - Monitor Render dashboard during deployment
   - Set up Render alerts for service failures
   - Use Render's preview environments for testing

---

**Questions?** Check Render's documentation at https://render.com/docs
