import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { WhatsAppService } from '../../services/whatsappService';

export function createSettingsRouter(pool: Pool): express.Router {
  const router = express.Router();
  const whatsappService = new WhatsAppService(pool);

  /**
   * GET /api/settings/whatsapp
   * Get current WhatsApp configuration
   */
  router.get('/whatsapp', async (_req: Request, res: Response): Promise<any> => {
    try {
      const config = await whatsappService.getConfig();

      if (!config) {
        return res.json({
          status: 'success',
          data: {
            phone_number: '',
            enabled: false,
            configured: false
          }
        });
      }

      // Don't send sensitive credentials to frontend
      res.json({
        status: 'success',
        data: {
          phone_number: config.phone_number,
          enabled: config.enabled,
          configured: true
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch WhatsApp configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/settings/whatsapp
   * Update WhatsApp configuration
   */
  router.post('/whatsapp', async (req: Request, res: Response): Promise<any> => {
    try {
      const { phone_number, enabled } = req.body;

      // Validate phone number format (E.164)
      if (!phone_number || typeof phone_number !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number is required'
        });
      }

      // Basic phone number validation (should start with + and contain 10-15 digits)
      const phoneRegex = /^\+[1-9]\d{9,14}$/;
      if (!phoneRegex.test(phone_number)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
        });
      }

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          status: 'error',
          message: 'Enabled must be a boolean value'
        });
      }

      await whatsappService.updateConfig(phone_number, enabled);

      res.json({
        status: 'success',
        message: 'WhatsApp configuration updated successfully',
        data: {
          phone_number,
          enabled
        }
      });
    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update WhatsApp configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/settings/whatsapp/test
   * Send a test WhatsApp message
   */
  router.post('/whatsapp/test', async (_req: Request, res: Response): Promise<any> => {
    try {
      const result = await whatsappService.testConnection();

      if (result.success) {
        res.json({
          status: 'success',
          message: result.message
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to test WhatsApp connection',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/settings/whatsapp/messages
   * Get WhatsApp message history
   */
  router.get('/whatsapp/messages', async (req: Request, res: Response): Promise<any> => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await pool.query(
        `SELECT id, phone_number, message, status, twilio_sid, error_message, sent_at
         FROM whatsapp_messages
         ORDER BY sent_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) as total FROM whatsapp_messages'
      );

      res.json({
        status: 'success',
        data: {
          messages: result.rows,
          total: parseInt(countResult.rows[0].total),
          limit,
          offset
        }
      });
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch WhatsApp messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
