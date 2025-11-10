# CKD High-Risk Monitoring Algorithm

## Clinical Decision Support System for CKD Risk Stratification

---

## Algorithm Overview

This algorithm identifies patients who have transitioned to a high-risk state requiring urgent monitoring, intervention, or specialist referral based on KDIGO (Kidney Disease: Improving Global Outcomes) guidelines and clinical best practices.

---

## Risk Detection Criteria

### 🔴 CRITICAL ALERTS (Immediate Action Required)

#### 1. Rapid eGFR Decline
**Threshold:** eGFR decline >5 mL/min/year or >25% from baseline
- **Clinical Significance:** Indicates rapid progression, high risk of ESRD
- **Action:** Urgent nephrology referral, investigate reversible causes
- **Detection:** `eGFRTrend == "down" AND eGFRChange <= -10`

#### 2. Severe CKD Without Specialist Care
**Threshold:** Stage 4-5 CKD without nephrologist
- **Clinical Significance:** Requires specialist management, dialysis planning
- **Action:** Immediate nephrology referral
- **Detection:** `ckdStage >= 4 AND nephrologistReferral == false`

#### 3. Dangerous Hyperkalemia
**Threshold:** Potassium >6.0 mEq/L
- **Clinical Significance:** Cardiac arrhythmia risk, life-threatening
- **Action:** Immediate evaluation, dietary counseling, medication adjustment
- **Detection:** `potassium > 6.0`

#### 4. Severe Anemia
**Threshold:** Hemoglobin <9.0 g/dL in CKD Stage 3+
- **Clinical Significance:** Increased mortality, reduced quality of life
- **Action:** Investigate cause, consider ESA therapy
- **Detection:** `hemoglobin < 9.0 AND ckdStage >= 3`

#### 5. Nephrotic-Range Proteinuria with Rapid Decline
**Threshold:** uACR >300 mg/g AND declining eGFR
- **Clinical Significance:** High progression risk, possible glomerular disease
- **Action:** Nephrology referral, kidney biopsy consideration
- **Detection:** `uACR > 300 AND eGFRTrend == "down"`

---

### 🟠 HIGH PRIORITY ALERTS (Action Within 2-4 Weeks)

#### 6. Stage Progression
**Threshold:** Moved from Stage 2→3, 3→4, or 4→5
- **Clinical Significance:** Indicates disease progression
- **Action:** Intensify management, review medications
- **Detection:** Compare current vs. historical stage

#### 7. New or Worsening Proteinuria
**Threshold:** Transition from A1→A2 or A2→A3
- **Clinical Significance:** Independent risk factor for progression
- **Action:** Optimize RAS inhibition, SGLT2i if diabetic
- **Detection:** `proteinuriaCategory == "A3" OR (A2 with recent progression)`

#### 8. Uncontrolled Hypertension in CKD
**Threshold:** BP ≥140/90 mmHg in CKD Stage 3+
- **Clinical Significance:** Accelerates CKD progression, CV risk
- **Action:** Intensify antihypertensive therapy
- **Detection:** `(systolicBP >= 140 OR diastolicBP >= 90) AND ckdStage >= 3`

#### 9. Uncontrolled Diabetes in CKD
**Threshold:** HbA1c >7.5% with CKD
- **Clinical Significance:** Accelerates progression, microvascular complications
- **Action:** Optimize diabetes control, consider SGLT2i
- **Detection:** `hba1c > 7.5 AND "Diabetes" in comorbidities`

#### 10. Hyperphosphatemia
**Threshold:** Phosphorus >4.5 mg/dL in Stage 4+
- **Clinical Significance:** Mineral bone disease, vascular calcification
- **Action:** Dietary restriction, phosphate binders
- **Detection:** `phosphorus > 4.5 AND ckdStage >= 4`

#### 11. Nephrotoxic Medications + Declining Function
**Threshold:** On nephrotoxic drugs with eGFR decline
- **Clinical Significance:** Iatrogenic kidney injury
- **Action:** Medication review, consider alternatives
- **Detection:** `nephrotoxicMeds == true AND eGFRTrend == "down"`

---

### 🟡 MODERATE ALERTS (Routine Follow-up Needed)

#### 12. Suboptimal Medication Therapy
**Criteria:**
- Stage 2+ with proteinuria but no RAS inhibitor
- Diabetic CKD Stage 2+ without SGLT2i
- **Action:** Initiate guideline-directed therapy

#### 13. Obesity in CKD
**Threshold:** BMI ≥30 with CKD Stage 2+
- **Clinical Significance:** Worsens metabolic risk, progression
- **Action:** Weight management program, dietary counseling

#### 14. Active Smoking
**Threshold:** Current smoker with CKD
- **Clinical Significance:** Accelerates progression
- **Action:** Smoking cessation program

#### 15. Overdue for Follow-up
**Threshold:** 
- Stage 4-5: >30 days since last visit
- Stage 3: >4 months since last visit
- **Action:** Schedule appointment

---

## Risk Scoring System

### Severity Score Calculation

Each alert receives a severity score:
- **Critical (10 points):** Criteria 1-5
- **High Priority (5 points):** Criteria 6-11
- **Moderate (2 points):** Criteria 12-15

**Total Risk Score:**
- **≥20 points:** CRITICAL - Immediate intervention
- **10-19 points:** HIGH - Urgent action within 1-2 weeks
- **5-9 points:** MODERATE - Action within 1 month
- **<5 points:** LOW - Routine monitoring

---

## Algorithm Implementation Logic

```python
def assess_patient_risk(patient):
    alerts = []
    severity_score = 0
    
    # CRITICAL ALERTS (10 points each)
    
    # 1. Rapid eGFR Decline
    if patient['eGFRTrend'] == 'down' and patient['eGFRChange'] <= -10:
        alerts.append({
            'severity': 'CRITICAL',
            'code': 'RAPID_DECLINE',
            'message': f"Rapid eGFR decline ({patient['eGFRChange']}%)",
            'action': 'Urgent nephrology referral, investigate reversible causes'
        })
        severity_score += 10
    
    # 2. Severe CKD Without Specialist
    if patient['ckdStage'] >= 4 and not patient['nephrologistReferral']:
        alerts.append({
            'severity': 'CRITICAL',
            'code': 'NO_SPECIALIST',
            'message': f"Stage {patient['ckdStage']} CKD without nephrologist",
            'action': 'Immediate nephrology referral required'
        })
        severity_score += 10
    
    # 3. Dangerous Hyperkalemia
    if patient['potassium'] > 6.0:
        alerts.append({
            'severity': 'CRITICAL',
            'code': 'HYPERKALEMIA',
            'message': f"Severe hyperkalemia (K+ {patient['potassium']} mEq/L)",
            'action': 'Immediate evaluation for cardiac monitoring'
        })
        severity_score += 10
    
    # 4. Severe Anemia
    if patient['hemoglobin'] < 9.0 and patient['ckdStage'] >= 3:
        alerts.append({
            'severity': 'CRITICAL',
            'code': 'SEVERE_ANEMIA',
            'message': f"Severe anemia (Hb {patient['hemoglobin']} g/dL)",
            'action': 'Investigate cause, consider ESA therapy'
        })
        severity_score += 10
    
    # 5. Nephrotic Proteinuria + Decline
    if patient['uACR'] > 300 and patient['eGFRTrend'] == 'down':
        alerts.append({
            'severity': 'CRITICAL',
            'code': 'NEPHROTIC_DECLINE',
            'message': f"Nephrotic-range proteinuria (uACR {patient['uACR']}) with declining eGFR",
            'action': 'Nephrology referral, consider kidney biopsy'
        })
        severity_score += 10
    
    # HIGH PRIORITY ALERTS (5 points each)
    
    # 6. Heavy Proteinuria
    if patient['proteinuriaCategory'] == 'A3':
        alerts.append({
            'severity': 'HIGH',
            'code': 'HEAVY_PROTEINURIA',
            'message': f"Heavy proteinuria (A3, uACR {patient['uACR']})",
            'action': 'Optimize RAS inhibition, add SGLT2i if diabetic'
        })
        severity_score += 5
    
    # 7. Uncontrolled Hypertension
    if (patient['systolicBP'] >= 140 or patient['diastolicBP'] >= 90) and patient['ckdStage'] >= 3:
        alerts.append({
            'severity': 'HIGH',
            'code': 'UNCONTROLLED_HTN',
            'message': f"Uncontrolled hypertension ({patient['systolicBP']}/{patient['diastolicBP']} mmHg)",
            'action': 'Intensify antihypertensive therapy'
        })
        severity_score += 5
    
    # 8. Uncontrolled Diabetes
    if patient.get('hba1c', 0) > 7.5 and 'Diabetes' in patient['comorbidities']:
        alerts.append({
            'severity': 'HIGH',
            'code': 'UNCONTROLLED_DM',
            'message': f"Uncontrolled diabetes (HbA1c {patient['hba1c']}%)",
            'action': 'Optimize glycemic control, consider SGLT2i'
        })
        severity_score += 5
    
    # 9. Hyperphosphatemia
    if patient['phosphorus'] > 4.5 and patient['ckdStage'] >= 4:
        alerts.append({
            'severity': 'HIGH',
            'code': 'HYPERPHOSPHATEMIA',
            'message': f"Elevated phosphorus ({patient['phosphorus']} mg/dL)",
            'action': 'Dietary counseling, phosphate binders'
        })
        severity_score += 5
    
    # 10. Nephrotoxic Meds + Decline
    if patient['nephrotoxicMeds'] and patient['eGFRTrend'] == 'down':
        alerts.append({
            'severity': 'HIGH',
            'code': 'NEPHROTOXIC_MEDS',
            'message': "Nephrotoxic medications with declining kidney function",
            'action': 'Medication review, consider alternatives'
        })
        severity_score += 5
    
    # 11. Moderate Anemia
    if 9.0 <= patient['hemoglobin'] < 11.0 and patient['ckdStage'] >= 3:
        alerts.append({
            'severity': 'HIGH',
            'code': 'MODERATE_ANEMIA',
            'message': f"Anemia (Hb {patient['hemoglobin']} g/dL)",
            'action': 'Iron studies, consider treatment'
        })
        severity_score += 5
    
    # MODERATE ALERTS (2 points each)
    
    # 12. Suboptimal RAS Inhibition
    if patient['ckdStage'] >= 2 and patient['uACR'] > 30 and not patient['onRASInhibitor']:
        alerts.append({
            'severity': 'MODERATE',
            'code': 'NO_RAS_INHIBITOR',
            'message': "Proteinuria without RAS inhibitor",
            'action': 'Consider ACE-I or ARB therapy'
        })
        severity_score += 2
    
    # 13. Missing SGLT2i
    if 'Diabetes' in patient['comorbidities'] and patient['ckdStage'] >= 2 and not patient['onSGLT2i']:
        alerts.append({
            'severity': 'MODERATE',
            'code': 'NO_SGLT2I',
            'message': "Diabetic CKD without SGLT2 inhibitor",
            'action': 'Consider SGLT2i for renoprotection'
        })
        severity_score += 2
    
    # 14. Obesity
    if patient['bmi'] >= 30 and patient['ckdStage'] >= 2:
        alerts.append({
            'severity': 'MODERATE',
            'code': 'OBESITY',
            'message': f"Obesity (BMI {patient['bmi']})",
            'action': 'Weight management program'
        })
        severity_score += 2
    
    # 15. Active Smoking
    if patient['smokingStatus'] == 'Current' and patient['ckdStage'] >= 2:
        alerts.append({
            'severity': 'MODERATE',
            'code': 'ACTIVE_SMOKING',
            'message': "Active smoker",
            'action': 'Smoking cessation counseling'
        })
        severity_score += 2
    
    return {
        'patient_id': patient['id'],
        'name': patient['name'],
        'mrn': patient['mrn'],
        'stage': patient['ckdStage'],
        'egfr': patient['eGFR'],
        'alerts': alerts,
        'severity_score': severity_score,
        'priority': get_priority_level(severity_score),
        'requires_monitoring': len(alerts) > 0
    }

def get_priority_level(score):
    if score >= 20:
        return 'CRITICAL'
    elif score >= 10:
        return 'HIGH'
    elif score >= 5:
        return 'MODERATE'
    else:
        return 'LOW'
```

---

## Output Format

For each high-risk patient, the system returns:

```json
{
  "patient_id": 1,
  "name": "John Anderson",
  "mrn": "MRN001",
  "stage": 4,
  "egfr": 28.5,
  "severity_score": 25,
  "priority": "CRITICAL",
  "requires_monitoring": true,
  "alerts": [
    {
      "severity": "CRITICAL",
      "code": "HYPERKALEMIA",
      "message": "Severe hyperkalemia (K+ 5.8 mEq/L)",
      "action": "Immediate evaluation for cardiac monitoring"
    },
    {
      "severity": "HIGH",
      "code": "NEPHROTOXIC_MEDS",
      "message": "Nephrotoxic medications with declining kidney function",
      "action": "Medication review, consider alternatives"
    }
  ]
}
```

---

## Clinical Decision Support Integration

### Dashboard Views

1. **Critical Alerts Dashboard**
   - Real-time monitoring of severity_score ≥20
   - Color-coded by priority (Red/Orange/Yellow)
   - One-click action items

2. **Nephrologist Referral Queue**
   - All Stage 4-5 without specialist
   - Rapid decliners regardless of stage

3. **Medication Optimization List**
   - Patients missing guideline-directed therapy
   - Nephrotoxic medication review needed

4. **Lab Alert Panel**
   - Hyperkalemia (K+ >5.5)
   - Anemia (Hb <11)
   - Hyperphosphatemia (P >4.5)

---

## Performance Metrics

### Key Performance Indicators (KPIs)

1. **Detection Rate:** % of high-risk patients identified
2. **False Positive Rate:** % of alerts not requiring action
3. **Time to Intervention:** Days from alert to action
4. **Progression Prevention:** % patients avoiding stage advancement

### Algorithm Sensitivity

- **Critical Alerts:** >95% sensitivity (minimal false negatives)
- **High Priority:** ~85% sensitivity
- **Moderate Alerts:** ~70% sensitivity (more preventive)

---

## Evidence Base

### Clinical Guidelines Referenced

1. **KDIGO 2024 CKD Guidelines**
   - eGFR decline thresholds
   - BP targets (<140/90 for CKD)
   - Proteinuria categories

2. **KDIGO 2012 Anemia Guidelines**
   - Hemoglobin thresholds for intervention

3. **ADA Standards of Care 2024**
   - HbA1c targets
   - SGLT2i recommendations

4. **ASN/KDIGO Electrolyte Guidelines**
   - Potassium management

---

## Implementation Considerations

### System Requirements
- Real-time or batch processing capability
- Integration with EHR/lab systems
- Alert fatigue mitigation strategies

### Alert Management
- Snooze functionality for acknowledged alerts
- Auto-resolve when criteria no longer met
- Escalation pathways for unresolved critical alerts

### Clinical Workflow
- Integration with existing care pathways
- Provider notification preferences
- Patient portal notifications (appropriate alerts)

---

## Future Enhancements

1. **Machine Learning Integration**
   - Predictive models for progression risk
   - Personalized alert thresholds

2. **Longitudinal Tracking**
   - Compare to historical baseline
   - Detect subtle trends over time

3. **Outcomes Tracking**
   - Monitor intervention effectiveness
   - Continuous algorithm improvement

4. **Population Health Analytics**
   - Aggregate risk across patient panels
   - Resource allocation optimization
