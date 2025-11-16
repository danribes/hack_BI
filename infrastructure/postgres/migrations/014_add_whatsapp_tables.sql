-- Migration: Add WhatsApp notification tables
-- Purpose: Enable WhatsApp notifications for patient status changes via Twilio

-- Table for WhatsApp configuration
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  phone_number VARCHAR(20) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  twilio_account_sid VARCHAR(255),
  twilio_auth_token VARCHAR(255),
  twilio_whatsapp_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_config CHECK (id = 1)
);

-- Table for WhatsApp message logs
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  twilio_sid VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient message history queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status, sent_at DESC);

-- Add comments
COMMENT ON TABLE whatsapp_config IS 'WhatsApp notification configuration using Twilio API';
COMMENT ON TABLE whatsapp_messages IS 'Log of WhatsApp messages sent via Twilio';
COMMENT ON COLUMN whatsapp_config.phone_number IS 'Phone number to receive notifications (E.164 format, e.g., +1234567890)';
COMMENT ON COLUMN whatsapp_config.enabled IS 'Whether WhatsApp notifications are enabled';
COMMENT ON COLUMN whatsapp_messages.twilio_sid IS 'Twilio message SID for tracking';
