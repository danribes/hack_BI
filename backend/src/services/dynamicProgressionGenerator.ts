/**
 * Dynamic Progression Generator
 *
 * Generates next cycle progression data on-demand as users navigate the timeline
 */

import { getPool } from '../config/database';
import { classifyKDIGOHealthState, KDIGOClassification, compareHealthStates } from './kdigoClassifier';

interface ProgressionState {
  patient_id: string;
  progression_type: 'progressive' | 'stable' | 'improving' | 'rapid';
  baseline_egfr: number;
  baseline_uacr: number;
  egfr_decline_rate: number;  // mL/min per month
  uacr_change_rate: number;   // % change per month
  created_at: Date;
}

interface GeneratedCycle {
  cycle_number: number;
  egfr_value: number;
  uacr_value: number;
  classification: KDIGOClassification;
  measured_at: Date;
  transition_detected: boolean;
  transition_details?: {
    from_state: string;
    to_state: string;
    change_type: 'improved' | 'worsened' | 'stable';
    alert_generated: boolean;
    alert_severity?: 'critical' | 'warning' | 'info';
  };
}

/**
 * Get or create progression state for a patient
 * This ensures consistent progression pattern across cycles
 */
export async function getProgressionState(patientId: string): Promise<ProgressionState> {
  const pool = getPool();

  // Check if progression state exists
  const existingState = await pool.query(`
    SELECT * FROM patient_progression_state
    WHERE patient_id = $1
  `, [patientId]);

  if (existingState.rows.length > 0) {
    return existingState.rows[0];
  }

  // Create new progression state based on patient's baseline
  const patientResult = await pool.query(`
    SELECT
      p.id,
      lr.egfr,
      lr.urine_albumin_creatinine_ratio as uacr
    FROM patients p
    LEFT JOIN lab_results lr ON p.id = lr.patient_id
    WHERE p.id = $1
    ORDER BY lr.test_date DESC
    LIMIT 1
  `, [patientId]);

  if (patientResult.rows.length === 0) {
    throw new Error('Patient not found');
  }

  const patient = patientResult.rows[0];
  const baseline_egfr = patient.egfr || 60;
  const baseline_uacr = patient.uacr || 20;

  // Randomly assign progression type with realistic distribution
  const random = Math.random();
  let progression_type: ProgressionState['progression_type'];
  let egfr_decline_rate: number;
  let uacr_change_rate: number;

  if (random < 0.05) {
    // 5% - Rapid progressors
    progression_type = 'rapid';
    egfr_decline_rate = -(0.67 + Math.random() * 0.33); // -8 to -12 mL/min/year = -0.67 to -1.0 per month
    uacr_change_rate = 0.03 + Math.random() * 0.05; // +3% to +8% per month
  } else if (random < 0.20) {
    // 15% - Improvers
    progression_type = 'improving';
    egfr_decline_rate = 0.02 + Math.random() * 0.03; // slight improvement +0.02 to +0.05 per month
    uacr_change_rate = -(0.02 + Math.random() * 0.03); // -2% to -5% per month
  } else if (random < 0.35) {
    // 30% - Progressive decliners
    progression_type = 'progressive';
    egfr_decline_rate = -(0.25 + Math.random() * 0.25); // -3 to -6 mL/min/year = -0.25 to -0.5 per month
    uacr_change_rate = 0.01 + Math.random() * 0.02; // +1% to +3% per month
  } else {
    // 50% - Stable patients
    progression_type = 'stable';
    egfr_decline_rate = -(0.04 + Math.random() * 0.08); // -0.5 to -1.5 mL/min/year = -0.04 to -0.12 per month
    uacr_change_rate = -(0.005 + Math.random() * 0.01); // -0.5% to -1.5% per month (slight improvement)
  }

  // Store progression state
  const insertResult = await pool.query(`
    INSERT INTO patient_progression_state (
      patient_id,
      progression_type,
      baseline_egfr,
      baseline_uacr,
      egfr_decline_rate,
      uacr_change_rate,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *
  `, [patientId, progression_type, baseline_egfr, baseline_uacr, egfr_decline_rate, uacr_change_rate]);

  return insertResult.rows[0];
}

/**
 * Generate the next cycle for a patient
 */
export async function generateNextCycle(
  patientId: string,
  currentCycle: number
): Promise<GeneratedCycle> {
  const pool = getPool();

  // Get progression state
  const progressionState = await getProgressionState(patientId);

  // Get previous cycle data
  const previousCycleResult = await pool.query(`
    SELECT *
    FROM health_state_history
    WHERE patient_id = $1 AND cycle_number = $2
    ORDER BY measured_at DESC
    LIMIT 1
  `, [patientId, currentCycle]);

  let previous_egfr: number;
  let previous_uacr: number;
  let previous_state: string | null = null;

  if (previousCycleResult.rows.length === 0 && currentCycle === 0) {
    // Generate baseline (cycle 0)
    previous_egfr = progressionState.baseline_egfr;
    previous_uacr = progressionState.baseline_uacr;
  } else if (previousCycleResult.rows.length === 0) {
    throw new Error(`Previous cycle ${currentCycle} not found. Generate cycles sequentially.`);
  } else {
    previous_egfr = parseFloat(previousCycleResult.rows[0].egfr_value);
    previous_uacr = parseFloat(previousCycleResult.rows[0].uacr_value);
    previous_state = previousCycleResult.rows[0].health_state;
  }

  const next_cycle = currentCycle + 1;

  // Calculate next cycle values with randomization
  const egfr_variation = (Math.random() - 0.5) * 2; // ±1 mL/min random variation
  const new_egfr = Math.max(5, previous_egfr + progressionState.egfr_decline_rate + egfr_variation);

  const uacr_variation = (Math.random() - 0.5) * 0.1; // ±5% random variation
  const new_uacr = Math.max(5, previous_uacr * (1 + progressionState.uacr_change_rate + uacr_variation));

  // Classify the new state
  const classification = classifyKDIGOHealthState(new_egfr, new_uacr);

  // Store in database
  const measured_at = new Date();
  await pool.query(`
    INSERT INTO health_state_history (
      patient_id,
      measured_at,
      cycle_number,
      egfr_value,
      uacr_value,
      gfr_category,
      albuminuria_category,
      health_state,
      risk_level,
      risk_color,
      ckd_stage,
      monitoring_frequency,
      nephrology_referral_needed,
      dialysis_planning_needed,
      treatment_recommendations
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `, [
    patientId,
    measured_at,
    next_cycle,
    new_egfr.toFixed(2),
    new_uacr.toFixed(2),
    classification.gfrCategory,
    classification.albuminuriaCategory,
    classification.healthState,
    classification.riskLevel,
    classification.riskColor,
    classification.ckdStage,
    classification.monitoringFrequency,
    classification.requiresNephrologyReferral,
    classification.requiresDialysisPlanning,
    JSON.stringify({
      ras_inhibitor: classification.recommendRASInhibitor,
      sglt2_inhibitor: classification.recommendSGLT2i,
      bp_target: classification.targetBP
    })
  ]);

  const generated_cycle: GeneratedCycle = {
    cycle_number: next_cycle,
    egfr_value: new_egfr,
    uacr_value: new_uacr,
    classification,
    measured_at,
    transition_detected: false
  };

  // Detect transition if there was a previous state
  if (previous_state && currentCycle >= 0) {
    const previous_classification = classifyKDIGOHealthState(previous_egfr, previous_uacr);
    const comparison = compareHealthStates(previous_classification, classification);

    if (comparison.hasChanged) {
      // Record transition
      const transitionResult = await pool.query(`
        INSERT INTO state_transitions (
          patient_id,
          transition_date,
          from_cycle,
          to_cycle,
          from_health_state,
          to_health_state,
          from_gfr_category,
          to_gfr_category,
          from_albuminuria_category,
          to_albuminuria_category,
          from_risk_level,
          to_risk_level,
          change_type,
          egfr_change,
          uacr_change,
          egfr_trend,
          uacr_trend,
          category_changed,
          risk_increased,
          crossed_critical_threshold,
          alert_generated,
          alert_severity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING id
      `, [
        patientId,
        measured_at,
        currentCycle,
        next_cycle,
        previous_state,
        classification.healthState,
        previous_classification.gfrCategory,
        classification.gfrCategory,
        previous_classification.albuminuriaCategory,
        classification.albuminuriaCategory,
        previous_classification.riskLevel,
        classification.riskLevel,
        comparison.changeType,
        (new_egfr - previous_egfr).toFixed(2),
        (new_uacr - previous_uacr).toFixed(2),
        new_egfr > previous_egfr ? 'improving' : (new_egfr < previous_egfr ? 'declining' : 'stable'),
        new_uacr > previous_uacr ? 'worsening' : (new_uacr < previous_uacr ? 'improving' : 'stable'),
        comparison.alertReason.includes('Category changed'),
        comparison.alertReason.includes('Risk level increased'),
        comparison.alertReason.includes('Critical threshold'),
        comparison.needsAlert,
        comparison.needsAlert ? (
          comparison.alertReason.some(r => r.includes('Critical threshold') || r.includes('below 30') || r.includes('below 15')) ? 'critical' :
          comparison.alertReason.some(r => r.includes('Category changed') || r.includes('Risk level increased')) ? 'warning' : 'info'
        ) : null
      ]);

      const transition_id = transitionResult.rows[0].id;

      // Generate alert if needed
      if (comparison.needsAlert) {
        const alert_severity: 'critical' | 'warning' | 'info' =
          comparison.alertReason.some(r => r.includes('Critical threshold') || r.includes('below 30') || r.includes('below 15')) ? 'critical' :
          comparison.alertReason.some(r => r.includes('Category changed') || r.includes('Risk level increased')) ? 'warning' : 'info';

        const alert_title = `Health State Transition: ${previous_state} → ${classification.healthState}`;
        const alert_message = `Patient transitioned from ${previous_state} (${previous_classification.riskLevel} risk) to ${classification.healthState} (${classification.riskLevel} risk). ${comparison.alertReason.join('. ')}`;

        await pool.query(`
          INSERT INTO monitoring_alerts (
            patient_id,
            transition_id,
            alert_type,
            severity,
            priority,
            title,
            message,
            alert_reasons,
            requires_action,
            status,
            generated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, [
          patientId,
          transition_id,
          'state_transition',
          alert_severity,
          alert_severity === 'critical' ? 1 : (alert_severity === 'warning' ? 2 : 3),
          alert_title,
          alert_message,
          comparison.alertReason,
          alert_severity === 'critical' || alert_severity === 'warning',
          'active'
        ]);
      }

      generated_cycle.transition_detected = true;
      generated_cycle.transition_details = {
        from_state: previous_state,
        to_state: classification.healthState,
        change_type: comparison.changeType,
        alert_generated: comparison.needsAlert,
        alert_severity: comparison.needsAlert ? (
          comparison.alertReason.some(r => r.includes('Critical threshold') || r.includes('below 30') || r.includes('below 15')) ? 'critical' :
          comparison.alertReason.some(r => r.includes('Category changed') || r.includes('Risk level increased')) ? 'warning' : 'info'
        ) : undefined
      };
    }
  }

  return generated_cycle;
}

/**
 * Initialize baseline (cycle 0) for a patient
 */
export async function initializeBaseline(patientId: string): Promise<GeneratedCycle> {
  const pool = getPool();

  // Check if baseline already exists
  const existingBaseline = await pool.query(`
    SELECT * FROM health_state_history
    WHERE patient_id = $1 AND cycle_number = 0
  `, [patientId]);

  if (existingBaseline.rows.length > 0) {
    const row = existingBaseline.rows[0];
    return {
      cycle_number: 0,
      egfr_value: parseFloat(row.egfr_value),
      uacr_value: parseFloat(row.uacr_value),
      classification: classifyKDIGOHealthState(parseFloat(row.egfr_value), parseFloat(row.uacr_value)),
      measured_at: row.measured_at,
      transition_detected: false
    };
  }

  // Get progression state (will create if doesn't exist)
  const progressionState = await getProgressionState(patientId);

  // Classify baseline
  const classification = classifyKDIGOHealthState(
    progressionState.baseline_egfr,
    progressionState.baseline_uacr
  );

  // Store baseline
  const measured_at = new Date();
  await pool.query(`
    INSERT INTO health_state_history (
      patient_id,
      measured_at,
      cycle_number,
      egfr_value,
      uacr_value,
      gfr_category,
      albuminuria_category,
      health_state,
      risk_level,
      risk_color,
      ckd_stage,
      monitoring_frequency,
      nephrology_referral_needed,
      dialysis_planning_needed,
      treatment_recommendations
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `, [
    patientId,
    measured_at,
    0,
    progressionState.baseline_egfr.toFixed(2),
    progressionState.baseline_uacr.toFixed(2),
    classification.gfrCategory,
    classification.albuminuriaCategory,
    classification.healthState,
    classification.riskLevel,
    classification.riskColor,
    classification.ckdStage,
    classification.monitoringFrequency,
    classification.requiresNephrologyReferral,
    classification.requiresDialysisPlanning,
    JSON.stringify({
      ras_inhibitor: classification.recommendRASInhibitor,
      sglt2_inhibitor: classification.recommendSGLT2i,
      bp_target: classification.targetBP
    })
  ]);

  return {
    cycle_number: 0,
    egfr_value: progressionState.baseline_egfr,
    uacr_value: progressionState.baseline_uacr,
    classification,
    measured_at,
    transition_detected: false
  };
}
