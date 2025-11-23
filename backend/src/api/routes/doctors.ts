/**
 * Doctor Management API Routes
 * Handles doctor profiles and patient-doctor assignments
 */

import { Router, Request, Response } from 'express';
import { getPool } from '../../config/database.js';
import { getPrimaryDoctor, getAllDoctorsForPatient } from '../../utils/doctorLookup.js';

const router = Router();

/**
 * GET /api/doctors
 * Get all doctors
 */
router.get('/', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT
        id,
        email,
        name,
        specialty,
        phone,
        notification_preferences,
        is_active,
        created_at
      FROM doctors
      WHERE is_active = true
      ORDER BY name ASC
    `);

    return res.json({
      status: 'success',
      doctors: result.rows
    });
  } catch (error) {
    console.error('[Doctors API] Error fetching doctors:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/doctors
 * Create a new doctor
 */
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, name, specialty, phone, notification_preferences } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and name are required'
      });
    }

    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO doctors (email, name, specialty, phone, notification_preferences)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, specialty, phone, notification_preferences, is_active, created_at
    `, [email, name, specialty, phone, notification_preferences || null]);

    return res.json({
      status: 'success',
      doctor: result.rows[0]
    });
  } catch (error) {
    console.error('[Doctors API] Error creating doctor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create doctor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/doctors/:email
 * Get doctor by email
 */
router.get('/:email', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.params;
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        id,
        email,
        name,
        specialty,
        phone,
        notification_preferences,
        email_signature,
        facility_name,
        is_active,
        created_at
      FROM doctors
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    return res.json({
      status: 'success',
      doctor: result.rows[0]
    });
  } catch (error) {
    console.error('[Doctors API] Error fetching doctor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch doctor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/doctors/:email
 * Update doctor profile
 */
router.put('/:email', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.params;
    const { name, specialty, phone, notification_preferences, email_signature, facility_name, is_active } = req.body;

    const pool = getPool();
    const result = await pool.query(`
      UPDATE doctors
      SET
        name = COALESCE($1, name),
        specialty = COALESCE($2, specialty),
        phone = COALESCE($3, phone),
        notification_preferences = COALESCE($4, notification_preferences),
        email_signature = COALESCE($5, email_signature),
        facility_name = COALESCE($6, facility_name),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE email = $8
      RETURNING id, email, name, specialty, phone, notification_preferences, email_signature, facility_name, is_active, updated_at
    `, [name, specialty, phone, notification_preferences, email_signature, facility_name, is_active, email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    return res.json({
      status: 'success',
      doctor: result.rows[0]
    });
  } catch (error) {
    console.error('[Doctors API] Error updating doctor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update doctor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/patients/:id/assign-doctor
 * Assign a doctor to a patient
 */
router.post('/:id/assign-doctor', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: patientId } = req.params;
    const { doctor_email, doctor_name, is_primary } = req.body;

    if (!doctor_email) {
      return res.status(400).json({
        status: 'error',
        message: 'doctor_email is required'
      });
    }

    const pool = getPool();

    // If this is a primary doctor, unset other primary doctors first
    if (is_primary) {
      await pool.query(`
        UPDATE doctor_patient_assignments
        SET is_primary = false
        WHERE patient_id = $1 AND is_primary = true
      `, [patientId]);
    }

    // Insert or update the assignment
    const result = await pool.query(`
      INSERT INTO doctor_patient_assignments (patient_id, doctor_email, doctor_name, is_primary)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (patient_id, doctor_email)
      DO UPDATE SET
        doctor_name = EXCLUDED.doctor_name,
        is_primary = EXCLUDED.is_primary,
        updated_at = NOW()
      RETURNING id, patient_id, doctor_email, doctor_name, is_primary, assigned_at
    `, [patientId, doctor_email, doctor_name || null, is_primary || false]);

    return res.json({
      status: 'success',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('[Doctors API] Error assigning doctor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to assign doctor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/patients/:id/doctors
 * Get all doctors assigned to a patient
 */
router.get('/:id/doctors', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: patientId } = req.params;
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        dpa.id,
        dpa.doctor_email,
        dpa.doctor_name,
        dpa.is_primary,
        dpa.assigned_at,
        d.name as doctor_full_name,
        d.specialty,
        d.phone,
        d.notification_preferences,
        d.is_active
      FROM doctor_patient_assignments dpa
      LEFT JOIN doctors d ON dpa.doctor_email = d.email
      WHERE dpa.patient_id = $1
      ORDER BY dpa.is_primary DESC, dpa.assigned_at ASC
    `, [patientId]);

    return res.json({
      status: 'success',
      doctors: result.rows
    });
  } catch (error) {
    console.error('[Doctors API] Error fetching patient doctors:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch patient doctors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/patients/:id/doctors/:email
 * Remove doctor assignment from patient
 */
router.delete('/:id/doctors/:email', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: patientId, email: doctorEmail } = req.params;
    const pool = getPool();

    const result = await pool.query(`
      DELETE FROM doctor_patient_assignments
      WHERE patient_id = $1 AND doctor_email = $2
      RETURNING id
    `, [patientId, doctorEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    return res.json({
      status: 'success',
      message: 'Doctor assignment removed'
    });
  } catch (error) {
    console.error('[Doctors API] Error removing doctor assignment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to remove doctor assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/patients/:id/primary-doctor
 * Get primary doctor for a patient (using utility function)
 */
router.get('/:id/primary-doctor', async (req: Request, res: Response): Promise<any> => {
  try {
    const { id: patientId } = req.params;
    const pool = getPool();

    const doctor = await getPrimaryDoctor(pool, patientId);

    return res.json({
      status: 'success',
      doctor
    });
  } catch (error) {
    console.error('[Doctors API] Error fetching primary doctor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch primary doctor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/doctors/assign-by-category
 * Bulk assign doctors to patients by category
 */
router.post('/assign-by-category', async (req: Request, res: Response): Promise<any> => {
  try {
    const { assignments } = req.body;
    // assignments = [
    //   { category: 'non_ckd_low', doctor_email: 'dr.smith@hospital.com', doctor_name: 'Dr. Smith' },
    //   { category: 'ckd_mild', doctor_email: 'dr.jones@hospital.com', doctor_name: 'Dr. Jones' }
    // ]

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({
        status: 'error',
        message: 'assignments array is required'
      });
    }

    const pool = getPool();
    const results = [];

    for (const assignment of assignments) {
      const { category, doctor_email, doctor_name } = assignment;

      if (!category || !doctor_email) {
        continue; // Skip invalid assignments
      }

      // Get patients for this category
      let query = '';
      let params: any[] = [];

      switch (category) {
        case 'non_ckd_low':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
            WHERE npd.risk_level = 'low'
          `;
          break;

        case 'non_ckd_moderate':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
            WHERE npd.risk_level = 'moderate'
          `;
          break;

        case 'non_ckd_high':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
            WHERE npd.risk_level = 'high'
          `;
          break;

        case 'ckd_mild':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
            WHERE cpd.ckd_severity = 'mild'
          `;
          break;

        case 'ckd_moderate':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
            WHERE cpd.ckd_severity = 'moderate'
          `;
          break;

        case 'ckd_severe':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
            WHERE cpd.ckd_severity = 'severe'
          `;
          break;

        case 'ckd_kidney_failure':
          query = `
            SELECT p.id FROM patients p
            INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
            WHERE cpd.ckd_severity = 'kidney_failure'
          `;
          break;

        default:
          continue; // Skip unknown categories
      }

      // Get patient IDs for this category
      const patientResult = await pool.query(query, params);
      const patientIds = patientResult.rows.map(row => row.id);

      // Assign doctor to all patients in this category
      let assignedCount = 0;
      for (const patientId of patientIds) {
        // Remove existing primary assignments for this patient
        await pool.query(`
          UPDATE doctor_patient_assignments
          SET is_primary = false
          WHERE patient_id = $1 AND is_primary = true
        `, [patientId]);

        // Insert or update the assignment
        await pool.query(`
          INSERT INTO doctor_patient_assignments (patient_id, doctor_email, doctor_name, is_primary)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (patient_id, doctor_email)
          DO UPDATE SET
            doctor_name = EXCLUDED.doctor_name,
            is_primary = EXCLUDED.is_primary,
            updated_at = NOW()
        `, [patientId, doctor_email, doctor_name]);

        assignedCount++;
      }

      results.push({
        category,
        doctor_email,
        patients_assigned: assignedCount
      });
    }

    return res.json({
      status: 'success',
      message: 'Bulk assignments completed',
      results
    });
  } catch (error) {
    console.error('[Doctors API] Error in bulk assignment by category:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to assign doctors by category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/doctors/category-stats
 * Get patient counts by category
 */
router.get('/category-stats', async (_req: Request, res: Response): Promise<any> => {
  try {
    const pool = getPool();

    const stats = await pool.query(`
      SELECT
        'non_ckd_low' as category,
        COUNT(*) as patient_count,
        'Non-CKD Low Risk' as display_name
      FROM patients p
      INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
      WHERE npd.risk_level = 'low'

      UNION ALL

      SELECT
        'non_ckd_moderate' as category,
        COUNT(*) as patient_count,
        'Non-CKD Moderate Risk' as display_name
      FROM patients p
      INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
      WHERE npd.risk_level = 'moderate'

      UNION ALL

      SELECT
        'non_ckd_high' as category,
        COUNT(*) as patient_count,
        'Non-CKD High Risk' as display_name
      FROM patients p
      INNER JOIN non_ckd_patient_data npd ON p.id = npd.patient_id
      WHERE npd.risk_level = 'high'

      UNION ALL

      SELECT
        'ckd_mild' as category,
        COUNT(*) as patient_count,
        'CKD Mild' as display_name
      FROM patients p
      INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      WHERE cpd.ckd_severity = 'mild'

      UNION ALL

      SELECT
        'ckd_moderate' as category,
        COUNT(*) as patient_count,
        'CKD Moderate' as display_name
      FROM patients p
      INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      WHERE cpd.ckd_severity = 'moderate'

      UNION ALL

      SELECT
        'ckd_severe' as category,
        COUNT(*) as patient_count,
        'CKD Severe' as display_name
      FROM patients p
      INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      WHERE cpd.ckd_severity = 'severe'

      UNION ALL

      SELECT
        'ckd_kidney_failure' as category,
        COUNT(*) as patient_count,
        'CKD Kidney Failure' as display_name
      FROM patients p
      INNER JOIN ckd_patient_data cpd ON p.id = cpd.patient_id
      WHERE cpd.ckd_severity = 'kidney_failure'

      ORDER BY category
    `);

    return res.json({
      status: 'success',
      categories: stats.rows
    });
  } catch (error) {
    console.error('[Doctors API] Error fetching category stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch category statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
