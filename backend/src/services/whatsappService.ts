import { Pool } from 'pg';

interface WhatsAppConfig {
  id: string;
  phone_number: string;
  enabled: boolean;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_whatsapp_number?: string;
}

interface WhatsAppMessage {
  to: string;
  subject: string;
  message: string;
  priority: string;
  patientName: string;
  mrn: string;
}

export class WhatsAppService {
  private db: Pool;
  private twilioClient: any = null;

  constructor(db: Pool) {
    this.db = db;
    this.initializeTwilio();
  }

  /**
   * Initialize Twilio client if credentials are available
   */
  private async initializeTwilio(): Promise<void> {
    try {
      // Try to get credentials from environment variables first
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (accountSid && authToken) {
        const twilio = await import('twilio');
        this.twilioClient = twilio.default(accountSid, authToken);
        console.log('✓ Twilio WhatsApp service initialized');
      } else {
        console.log('⚠️  Twilio credentials not found in environment variables');
        console.log('   WhatsApp notifications will be logged but not sent');
      }
    } catch (error) {
      console.error('Failed to initialize Twilio:', error);
      console.log('⚠️  WhatsApp notifications will be logged but not sent');
    }
  }

  /**
   * Get WhatsApp configuration from database
   */
  async getConfig(): Promise<WhatsAppConfig | null> {
    try {
      const result = await this.db.query(
        'SELECT * FROM whatsapp_config WHERE id = 1'
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error);
      return null;
    }
  }

  /**
   * Update WhatsApp configuration
   */
  async updateConfig(phoneNumber: string, enabled: boolean): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO whatsapp_config (id, phone_number, enabled, updated_at)
         VALUES (1, $1, $2, NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           phone_number = $1,
           enabled = $2,
           updated_at = NOW()`,
        [phoneNumber, enabled]
      );

      console.log(`✓ WhatsApp config updated: ${phoneNumber} (enabled: ${enabled})`);
    } catch (error) {
      console.error('Error updating WhatsApp config:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendNotification(messageData: WhatsAppMessage): Promise<boolean> {
    try {
      // Get configuration
      const config = await this.getConfig();

      if (!config || !config.enabled) {
        console.log('⚠️  WhatsApp notifications are disabled');
        return false;
      }

      if (!config.phone_number) {
        console.log('⚠️  WhatsApp phone number not configured');
        return false;
      }

      // Format the message
      const formattedMessage = this.formatMessage(messageData);

      // If Twilio is not initialized, just log the message
      if (!this.twilioClient) {
        console.log('📱 [WhatsApp] Would send to', config.phone_number);
        console.log('Message:', formattedMessage);
        return false;
      }

      // Get Twilio WhatsApp number from environment or config
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || config.twilio_whatsapp_number;

      if (!fromNumber) {
        console.error('⚠️  Twilio WhatsApp number not configured');
        return false;
      }

      // Send via Twilio
      const message = await this.twilioClient.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${config.phone_number}`,
        body: formattedMessage,
      });

      console.log(`✓ WhatsApp notification sent (SID: ${message.sid})`);

      // Log the sent message in database
      await this.logSentMessage(config.phone_number, formattedMessage, message.sid);

      return true;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);

      // Log failed attempt
      const config = await this.getConfig();
      if (config) {
        await this.logFailedMessage(config.phone_number, this.formatMessage(messageData), error);
      }

      return false;
    }
  }

  /**
   * Format message for WhatsApp
   */
  private formatMessage(data: WhatsAppMessage): string {
    const emoji = this.getPriorityEmoji(data.priority);

    return `${emoji} *${data.subject}*

👤 Patient: ${data.patientName}
🏥 MRN: ${data.mrn}
⚠️ Priority: ${data.priority}

${data.message}

_Sent from CKD Analyzer System_`;
  }

  /**
   * Get emoji based on priority
   */
  private getPriorityEmoji(priority: string): string {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚡';
      case 'MODERATE':
        return '📋';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Log sent message to database
   */
  private async logSentMessage(to: string, message: string, twilioSid: string): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO whatsapp_messages (phone_number, message, status, twilio_sid, sent_at)
         VALUES ($1, $2, 'sent', $3, NOW())`,
        [to, message, twilioSid]
      );
    } catch (error) {
      console.error('Error logging sent WhatsApp message:', error);
    }
  }

  /**
   * Log failed message attempt
   */
  private async logFailedMessage(to: string, message: string, error: any): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.db.query(
        `INSERT INTO whatsapp_messages (phone_number, message, status, error_message, sent_at)
         VALUES ($1, $2, 'failed', $3, NOW())`,
        [to, message, errorMessage]
      );
    } catch (err) {
      console.error('Error logging failed WhatsApp message:', err);
    }
  }

  /**
   * Test WhatsApp connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();

    if (!config) {
      return { success: false, message: 'WhatsApp not configured' };
    }

    if (!config.enabled) {
      return { success: false, message: 'WhatsApp notifications are disabled' };
    }

    if (!this.twilioClient) {
      return { success: false, message: 'Twilio credentials not configured' };
    }

    try {
      // Send test message
      const testMessage: WhatsAppMessage = {
        to: config.phone_number,
        subject: 'Test Notification',
        message: 'This is a test message from the CKD Analyzer System. WhatsApp notifications are working correctly!',
        priority: 'MODERATE',
        patientName: 'Test Patient',
        mrn: 'TEST-001',
      };

      const sent = await this.sendNotification(testMessage);

      if (sent) {
        return { success: true, message: 'Test message sent successfully' };
      } else {
        return { success: false, message: 'Failed to send test message' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
