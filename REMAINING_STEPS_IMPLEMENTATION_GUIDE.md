# Implementation Guide: Remaining Steps for Doctor Email System

## 📊 Implementation Status Summary

| Step | Status | Completion |
|------|--------|------------|
| **Step 1: Patient-Doctor Assignment** | ✅ COMPLETED | 100% |
| **Step 2: Alert Acknowledgment Workflow** | ✅ COMPLETED | 100% |
| **Step 3: Multi-Doctor Support** | 🟡 PARTIAL | 60% |
| **Step 4: Email Template Customization** | 🟡 PARTIAL | 40% |
| **Step 5: Analytics & Monitoring** | ❌ NOT STARTED | 0% |

---

## ✅ Already Implemented (Steps 1 & 2)

### Step 1: Patient-Doctor Assignment ✅
- ✅ Migration 021: `doctor_patient_assignments` table created
- ✅ Migration 022: `doctors` table with preferences created
- ✅ Utility: `doctorLookup.ts` with `getPrimaryDoctor()` function
- ✅ All 4 alert types updated to use database lookups
- ✅ API endpoints: POST/GET/DELETE for patient-doctor assignments
- ✅ UI: Doctor assignment interface with category-based bulk assignment

### Step 2: Alert Acknowledgment Workflow ✅
- ✅ Service: `alertReminderService.ts` created
- ✅ Checks CRITICAL alerts older than 4 hours every 30 minutes
- ✅ Maximum 3 reminders per alert
- ✅ Integrated into main server (`index.ts`)

---

## 🟡 Step 3: Multi-Doctor Support (PARTIAL - 60% Complete)

### ✅ Already Done:
- Database infrastructure exists (`doctors` table, `doctor_patient_assignments` table)
- `is_primary` flag supports primary vs. consulting doctors
- `notification_preferences` JSONB field for per-doctor settings

### ❌ What's Missing:
- Logic to notify **consulting doctors** for CRITICAL alerts only
- Logic to notify **care team members**
- UI to assign multiple doctors to a single patient

---

### 📝 Implementation Plan for Step 3

#### A. Update Alert Notification Logic

**File: `backend/src/services/clinicalAlertsService.ts`**

Currently, only the primary doctor is notified. We need to:

1. Query all doctors for a patient (not just primary)
2. Apply notification rules based on alert severity
3. Respect each doctor's notification preferences

**Code Changes:**

```typescript
// Add new function to doctorLookup.ts
export async function getAllDoctorsForPatient(
  db: Pool,
  patientId: string
): Promise<DoctorAssignment[]> {
  const result = await db.query(`
    SELECT
      dpa.doctor_email,
      dpa.doctor_name,
      dpa.is_primary,
      d.notification_preferences,
      d.email_signature
    FROM doctor_patient_assignments dpa
    LEFT JOIN doctors d ON dpa.doctor_email = d.email
    WHERE dpa.patient_id = $1
    ORDER BY dpa.is_primary DESC, dpa.assigned_at ASC
  `, [patientId]);

  return result.rows.map(row => ({
    doctor_email: row.doctor_email,
    doctor_name: row.doctor_name || 'Physician',
    is_primary: row.is_primary,
    notification_preferences: row.notification_preferences,
    email_signature: row.email_signature
  }));
}
```

```typescript
// Update clinicalAlertsService.ts
private async notifyDoctors(
  patient: any,
  alertType: string,
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE',
  message: string
): Promise<void> {
  const doctors = await getAllDoctorsForPatient(this.db, patient.id);

  for (const doctor of doctors) {
    // Check if this doctor should be notified based on role and severity
    const shouldNotify = this.shouldNotifyDoctor(doctor, severity);

    if (shouldNotify) {
      await this.emailService.sendNotification({
        to: doctor.doctor_email,
        subject: `${severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡'} ${alertType}`,
        message,
        priority: severity,
        patientName: `${patient.first_name} ${patient.last_name}`,
        mrn: patient.medical_record_number,
      });
    }
  }
}

private shouldNotifyDoctor(
  doctor: DoctorAssignment,
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE'
): boolean {
  // Always notify primary doctor
  if (doctor.is_primary) {
    return true;
  }

  // Check notification preferences
  const prefs = doctor.notification_preferences || {};

  // Consulting doctors: only notify for CRITICAL
  if (severity === 'CRITICAL') {
    return prefs.critical_via === 'email';
  }

  if (severity === 'HIGH') {
    return prefs.high_via === 'email';
  }

  if (severity === 'MODERATE') {
    return prefs.moderate_via === 'email';
  }

  return false;
}
```

#### B. Add Multi-Doctor Assignment UI

**File: `frontend/src/components/DoctorAssignmentInterface.tsx`**

Add a new section to assign multiple doctors to individual patients:

```typescript
// Add new component for patient-specific doctor assignment
const PatientDoctorAssignment: React.FC<{ apiUrl: string }> = ({ apiUrl }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assignedDoctors, setAssignedDoctors] = useState([]);

  const fetchPatientDoctors = async (patientId: string) => {
    const response = await fetch(`${apiUrl}/api/patients/${patientId}/doctors`);
    const data = await response.json();
    setAssignedDoctors(data.doctors || []);
  };

  const assignDoctor = async (patientId: string, doctorEmail: string, isPrimary: boolean) => {
    await fetch(`${apiUrl}/api/patients/${patientId}/assign-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_email: doctorEmail,
        is_primary: isPrimary
      })
    });
    fetchPatientDoctors(patientId);
  };

  // UI implementation...
};
```

#### C. Update Database Query in API Routes

**File: `backend/src/api/routes/doctors.ts`**

The endpoint `GET /api/patients/:id/doctors` already exists (line 473). Just verify it returns all doctors, not just primary.

---

## 🟡 Step 4: Email Template Customization (PARTIAL - 40% Complete)

### ✅ Already Done:
- Database fields: `email_signature`, `facility_name`, `facility_logo_url` exist in `doctors` table
- Basic signature support in email service

### ❌ What's Missing:
- Custom email templates per doctor
- Template variables/placeholders
- HTML email support with branding
- Template preview feature

---

### 📝 Implementation Plan for Step 4

#### A. Create Email Templates Table

**Migration 023: Email Templates**

```sql
-- Migration 023: Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_email VARCHAR(255) REFERENCES doctors(email) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_html BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_email, template_name)
);

-- Default templates for common alert types
INSERT INTO email_templates (doctor_email, template_name, subject_template, body_template, is_html)
VALUES
  ('doctor@example.com', 'kidney_function_decline',
   '🔻 ALERT: {{patient_name}} - Kidney Function Worsening',
   'Dear Dr. {{doctor_name}},\n\nPatient {{patient_name}} (MRN: {{mrn}}) has shown declining kidney function:\n\n{{alert_details}}\n\nPlease review at your earliest convenience.\n\nBest regards,\n{{facility_name}}',
   false
  ),
  ('doctor@example.com', 'abnormal_lab_value',
   '⚠️ ALERT: {{patient_name}} - Abnormal Lab Results',
   'Dear Dr. {{doctor_name}},\n\nPatient {{patient_name}} (MRN: {{mrn}}) has abnormal lab results:\n\n{{alert_details}}\n\nAction may be required.\n\nBest regards,\n{{facility_name}}',
   false
  );

CREATE INDEX idx_email_templates_doctor ON email_templates(doctor_email);
COMMENT ON TABLE email_templates IS 'Custom email templates per doctor for alert notifications';
```

#### B. Update Email Service to Use Templates

**File: `backend/src/services/emailService.ts`**

Add template rendering logic:

```typescript
private async renderTemplate(
  templateName: string,
  doctorEmail: string,
  variables: { [key: string]: any }
): Promise<{ subject: string; body: string }> {
  // Fetch template from database
  const result = await this.db.query(`
    SELECT subject_template, body_template, is_html
    FROM email_templates
    WHERE doctor_email = $1 AND template_name = $2
    LIMIT 1
  `, [doctorEmail, templateName]);

  let subject = '';
  let body = '';

  if (result.rows.length > 0) {
    subject = result.rows[0].subject_template;
    body = result.rows[0].body_template;
  } else {
    // Fall back to default template
    const defaultResult = await this.db.query(`
      SELECT subject_template, body_template
      FROM email_templates
      WHERE doctor_email = 'doctor@example.com' AND template_name = $1
      LIMIT 1
    `, [templateName]);

    if (defaultResult.rows.length > 0) {
      subject = defaultResult.rows[0].subject_template;
      body = defaultResult.rows[0].body_template;
    }
  }

  // Replace variables
  subject = this.replaceVariables(subject, variables);
  body = this.replaceVariables(body, variables);

  return { subject, body };
}

private replaceVariables(template: string, variables: { [key: string]: any }): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}
```

#### C. Add Template Management UI

**File: `frontend/src/components/EmailTemplateEditor.tsx`**

Create new component for doctors to customize templates:

```typescript
interface EmailTemplateEditorProps {
  apiUrl: string;
  doctorEmail: string;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({ apiUrl, doctorEmail }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const availableVariables = [
    '{{patient_name}}',
    '{{mrn}}',
    '{{doctor_name}}',
    '{{alert_details}}',
    '{{facility_name}}',
    '{{date}}',
    '{{time}}'
  ];

  const saveTemplate = async () => {
    await fetch(`${apiUrl}/api/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctor_email: doctorEmail,
        template_name: selectedTemplate,
        subject_template: subject,
        body_template: body
      })
    });
  };

  // UI with rich text editor, variable insertion buttons, preview pane...
};
```

#### D. Add API Endpoints for Templates

**File: `backend/src/api/routes/emailTemplates.ts`** (NEW FILE)

```typescript
import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database.js';

const router = Router();

// GET /api/email-templates/:doctorEmail
router.get('/:doctorEmail', async (req: Request, res: Response): Promise<any> => {
  const { doctorEmail } = req.params;
  const pool = getPool();

  const result = await pool.query(`
    SELECT * FROM email_templates
    WHERE doctor_email = $1
    ORDER BY template_name
  `, [doctorEmail]);

  return res.json({
    status: 'success',
    templates: result.rows
  });
});

// POST /api/email-templates
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { doctor_email, template_name, subject_template, body_template, is_html } = req.body;
  const pool = getPool();

  const result = await pool.query(`
    INSERT INTO email_templates (doctor_email, template_name, subject_template, body_template, is_html)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (doctor_email, template_name)
    DO UPDATE SET
      subject_template = EXCLUDED.subject_template,
      body_template = EXCLUDED.body_template,
      is_html = EXCLUDED.is_html,
      updated_at = NOW()
    RETURNING *
  `, [doctor_email, template_name, subject_template, body_template, is_html || false]);

  return res.json({
    status: 'success',
    template: result.rows[0]
  });
});

// DELETE /api/email-templates/:doctorEmail/:templateName
router.delete('/:doctorEmail/:templateName', async (req: Request, res: Response): Promise<any> => {
  const { doctorEmail, templateName } = req.params;
  const pool = getPool();

  await pool.query(`
    DELETE FROM email_templates
    WHERE doctor_email = $1 AND template_name = $2
  `, [doctorEmail, templateName]);

  return res.json({
    status: 'success',
    message: 'Template deleted'
  });
});

export default router;
```

Register in `index.ts`:

```typescript
import emailTemplatesRouter from './api/routes/emailTemplates';
app.use('/api/email-templates', emailTemplatesRouter);
```

---

## ❌ Step 5: Analytics & Monitoring (NOT STARTED - 0% Complete)

### 📝 Implementation Plan for Step 5

#### A. Create Analytics Tables

**Migration 024: Analytics Tables**

```sql
-- Migration 024: Analytics and Monitoring
CREATE TABLE IF NOT EXISTS alert_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES doctor_notifications(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_email VARCHAR(255),
  alert_type VARCHAR(100),
  priority VARCHAR(20),

  -- Timing metrics
  created_at TIMESTAMP NOT NULL,
  first_viewed_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Response time in seconds
  time_to_view INTEGER,
  time_to_acknowledge INTEGER,
  time_to_resolve INTEGER,

  -- Alert characteristics
  retry_count INTEGER DEFAULT 0,
  escalated BOOLEAN DEFAULT false,

  CONSTRAINT valid_timestamps CHECK (
    first_viewed_at IS NULL OR first_viewed_at >= created_at
  )
);

CREATE INDEX idx_alert_analytics_doctor ON alert_analytics(doctor_email);
CREATE INDEX idx_alert_analytics_created ON alert_analytics(created_at);
CREATE INDEX idx_alert_analytics_priority ON alert_analytics(priority);

-- Aggregate statistics view
CREATE OR REPLACE VIEW doctor_performance_stats AS
SELECT
  doctor_email,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN priority = 'CRITICAL' THEN 1 END) as critical_alerts,
  COUNT(CASE WHEN priority = 'HIGH' THEN 1 END) as high_alerts,
  COUNT(CASE WHEN priority = 'MODERATE' THEN 1 END) as moderate_alerts,

  -- Average response times
  AVG(time_to_view) as avg_time_to_view_seconds,
  AVG(time_to_acknowledge) as avg_time_to_acknowledge_seconds,
  AVG(time_to_resolve) as avg_time_to_resolve_seconds,

  -- Acknowledgment rate
  ROUND(100.0 * COUNT(acknowledged_at) / NULLIF(COUNT(*), 0), 2) as acknowledgment_rate_percent,

  -- Recent period (last 30 days)
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as alerts_last_30_days

FROM alert_analytics
GROUP BY doctor_email;

COMMENT ON VIEW doctor_performance_stats IS 'Aggregate performance metrics per doctor';
```

#### B. Create Analytics Service

**File: `backend/src/services/analyticsService.ts`** (NEW FILE)

```typescript
import { Pool } from 'pg';

export class AnalyticsService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Track alert creation
   */
  async trackAlertCreated(
    alertId: string,
    patientId: string,
    doctorEmail: string,
    alertType: string,
    priority: string
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO alert_analytics (
        alert_id, patient_id, doctor_email, alert_type, priority, created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [alertId, patientId, doctorEmail, alertType, priority]);
  }

  /**
   * Track alert acknowledgment
   */
  async trackAlertAcknowledged(alertId: string): Promise<void> {
    await this.db.query(`
      UPDATE alert_analytics
      SET
        acknowledged_at = NOW(),
        time_to_acknowledge = EXTRACT(EPOCH FROM (NOW() - created_at))::INTEGER
      WHERE alert_id = $1
    `, [alertId]);
  }

  /**
   * Get doctor performance dashboard
   */
  async getDoctorPerformance(doctorEmail: string): Promise<any> {
    const result = await this.db.query(`
      SELECT * FROM doctor_performance_stats
      WHERE doctor_email = $1
    `, [doctorEmail]);

    return result.rows[0] || null;
  }

  /**
   * Get most common alert types
   */
  async getMostCommonAlerts(days: number = 30): Promise<any[]> {
    const result = await this.db.query(`
      SELECT
        alert_type,
        COUNT(*) as count,
        AVG(time_to_acknowledge) as avg_response_time,
        COUNT(CASE WHEN priority = 'CRITICAL' THEN 1 END) as critical_count
      FROM alert_analytics
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY alert_type
      ORDER BY count DESC
      LIMIT 10
    `);

    return result.rows;
  }

  /**
   * Get alert trends over time
   */
  async getAlertTrends(days: number = 30): Promise<any[]> {
    const result = await this.db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN priority = 'CRITICAL' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN acknowledged_at IS NOT NULL THEN 1 END) as acknowledged_alerts,
        AVG(time_to_acknowledge) as avg_response_time
      FROM alert_analytics
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return result.rows;
  }
}
```

#### C. Update Alert Service to Track Analytics

**File: `backend/src/services/clinicalAlertsService.ts`**

```typescript
import { AnalyticsService } from './analyticsService.js';

// In constructor:
private analyticsService: AnalyticsService;

constructor(db: Pool, emailService: EmailService) {
  this.db = db;
  this.emailService = emailService;
  this.analyticsService = new AnalyticsService(db);
}

// After creating notification:
await this.analyticsService.trackAlertCreated(
  notificationId,
  patient.id,
  doctor.doctor_email,
  'kidney_function_decline',
  'HIGH'
);
```

#### D. Create Analytics Dashboard UI

**File: `frontend/src/components/AnalyticsDashboard.tsx`** (NEW FILE)

```typescript
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AnalyticsDashboardProps {
  apiUrl: string;
  doctorEmail?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ apiUrl, doctorEmail }) => {
  const [performance, setPerformance] = useState(null);
  const [trends, setTrends] = useState([]);
  const [commonAlerts, setCommonAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [doctorEmail]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch doctor performance
      if (doctorEmail) {
        const perfResponse = await fetch(`${apiUrl}/api/analytics/doctor/${doctorEmail}`);
        const perfData = await perfResponse.json();
        setPerformance(perfData.performance);
      }

      // Fetch trends
      const trendsResponse = await fetch(`${apiUrl}/api/analytics/trends?days=30`);
      const trendsData = await trendsResponse.json();
      setTrends(trendsData.trends);

      // Fetch common alerts
      const alertsResponse = await fetch(`${apiUrl}/api/analytics/common-alerts?days=30`);
      const alertsData = await alertsResponse.json();
      setCommonAlerts(alertsData.alerts);

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Alerts</div>
            <div className="text-3xl font-bold">{performance.total_alerts}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Avg Response Time</div>
            <div className="text-3xl font-bold">
              {Math.round(performance.avg_time_to_acknowledge_seconds / 60)}m
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Acknowledgment Rate</div>
            <div className="text-3xl font-bold">
              {performance.acknowledgment_rate_percent}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Critical Alerts</div>
            <div className="text-3xl font-bold text-red-600">
              {performance.critical_alerts}
            </div>
          </div>
        </div>
      )}

      {/* Alert Trends Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Alert Trends (Last 30 Days)</h3>
        <LineChart width={800} height={300} data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total_alerts" stroke="#8884d8" name="Total Alerts" />
          <Line type="monotone" dataKey="critical_alerts" stroke="#ff0000" name="Critical Alerts" />
        </LineChart>
      </div>

      {/* Most Common Alerts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Most Common Alert Types</h3>
        <BarChart width={800} height={300} data={commonAlerts}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="alert_type" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" name="Count" />
        </BarChart>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
```

#### E. Add Analytics API Endpoints

**File: `backend/src/api/routes/analytics.ts`** (NEW FILE)

```typescript
import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database.js';
import { AnalyticsService } from '../../services/analyticsService.js';

const router = Router();

router.get('/doctor/:email', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.params;
    const pool = getPool();
    const analyticsService = new AnalyticsService(pool);

    const performance = await analyticsService.getDoctorPerformance(email);

    return res.json({
      status: 'success',
      performance
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance data'
    });
  }
});

router.get('/trends', async (req: Request, res: Response): Promise<any> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const pool = getPool();
    const analyticsService = new AnalyticsService(pool);

    const trends = await analyticsService.getAlertTrends(days);

    return res.json({
      status: 'success',
      trends
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trends'
    });
  }
});

router.get('/common-alerts', async (req: Request, res: Response): Promise<any> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const pool = getPool();
    const analyticsService = new AnalyticsService(pool);

    const alerts = await analyticsService.getMostCommonAlerts(days);

    return res.json({
      status: 'success',
      alerts
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch common alerts'
    });
  }
});

export default router;
```

Register in `index.ts`:

```typescript
import analyticsRouter from './api/routes/analytics';
app.use('/api/analytics', analyticsRouter);
```

#### F. Install Chart Library (Frontend)

```bash
cd frontend
npm install recharts
```

---

## 🎯 Implementation Priority Recommendation

1. **High Priority: Step 3B - Multi-Doctor Assignment UI**
   - Quick win, enhances existing functionality
   - Estimated time: 2-4 hours

2. **Medium Priority: Step 4A-B - Email Template System**
   - Adds significant value for doctors
   - Estimated time: 4-6 hours

3. **Low Priority: Step 5 - Analytics Dashboard**
   - Nice to have, not critical for core functionality
   - Estimated time: 6-8 hours

---

## 📋 Testing Checklist

### Step 3 Testing:
- [ ] Assign multiple doctors to a single patient
- [ ] Verify primary doctor receives all alerts
- [ ] Verify consulting doctor receives only CRITICAL alerts
- [ ] Check notification preferences are respected

### Step 4 Testing:
- [ ] Create custom email template
- [ ] Verify variables are replaced correctly
- [ ] Test HTML vs. plain text templates
- [ ] Preview template before sending

### Step 5 Testing:
- [ ] Verify analytics data is captured on alert creation
- [ ] Check acknowledgment tracking updates correctly
- [ ] Validate dashboard displays correct metrics
- [ ] Test date range filtering

---

## 📦 Required Dependencies

### Backend:
```bash
# Already installed
npm install pg
npm install nodemailer
```

### Frontend:
```bash
cd frontend
npm install recharts  # For Step 5 charts
```

---

## 🔗 Related Files Reference

- **Migrations**: `infrastructure/postgres/migrations/021_*.sql`, `022_*.sql`
- **Services**: `backend/src/services/clinicalAlertsService.ts`, `alertReminderService.ts`
- **Utilities**: `backend/src/utils/doctorLookup.ts`
- **API Routes**: `backend/src/api/routes/doctors.ts`
- **Frontend**: `frontend/src/components/DoctorAssignmentInterface.tsx`

---

## 💡 Questions?

If you encounter issues or need clarification on any step, refer to the existing implementation in the completed steps (1 & 2) for patterns and best practices.

Good luck with the implementation! 🚀
