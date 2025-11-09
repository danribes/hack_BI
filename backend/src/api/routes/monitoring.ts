/**
 * High-Risk Monitoring API Routes
 *
 * Endpoints for the CKD high-risk patient monitoring system
 */

import { Router, Request, Response } from 'express';
import {
  scanPatientDatabase,
  getHighRiskPatientsByPriority,
  getCriticalPatients,
  MonitoringPriority
} from '../../services/riskMonitoringService';

const router = Router();

/**
 * GET /api/monitoring/scan
 * Run a complete scan of the patient database and return high-risk patient results
 */
router.get('/scan', async (_req: Request, res: Response): Promise<void> => {
  try {
    const results = await scanPatientDatabase();

    res.json({
      status: 'success',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error scanning patient database:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to scan patient database',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/critical
 * Get patients requiring immediate action (CRITICAL priority)
 */
router.get('/critical', async (_req: Request, res: Response): Promise<void> => {
  try {
    const criticalPatients = await getCriticalPatients();

    res.json({
      status: 'success',
      data: criticalPatients,
      count: criticalPatients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching critical patients:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch critical patients',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/priority/:priority
 * Get patients filtered by priority level
 * @param priority - CRITICAL, HIGH, MODERATE, or LOW
 */
router.get('/priority/:priority', async (req: Request, res: Response): Promise<void> => {
  try {
    const priority = req.params.priority.toUpperCase() as MonitoringPriority;

    // Validate priority
    if (!['CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(priority)) {
      res.status(400).json({
        status: 'error',
        error: 'Invalid priority level',
        message: 'Priority must be one of: CRITICAL, HIGH, MODERATE, LOW',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const patients = await getHighRiskPatientsByPriority(priority);

    res.json({
      status: 'success',
      data: patients,
      count: patients.length,
      priority,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching patients by priority:`, error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch patients by priority',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/monitoring/stats
 * Get monitoring statistics without full patient list
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const results = await scanPatientDatabase();

    // Return only statistics, not full patient list
    res.json({
      status: 'success',
      data: {
        scan_date: results.scan_date,
        total_patients_scanned: results.total_patients_scanned,
        high_risk_patients: results.high_risk_patients,
        high_risk_percentage: results.high_risk_percentage,
        priority_distribution: results.priority_distribution,
        alert_frequency: results.alert_frequency
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching monitoring stats:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch monitoring statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
