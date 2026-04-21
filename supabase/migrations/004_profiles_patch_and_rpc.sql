-- ============================================================
-- ReActivate AI — Production Schema v1 Patch
-- Add WhatsApp/Sync/Automation columns to profiles
-- Create claim_message_jobs RPC for queue-worker
-- Applied: 2026-04-19
-- ============================================================

-- Profiles: WhatsApp API integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_cloud_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_phone_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_mode_enabled BOOLEAN DEFAULT false;

-- Profiles: Automation engine
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS automation_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_order_value NUMERIC DEFAULT 1000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'General';

-- Profiles: External sync
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS external_sync_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sync_active BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

-- ============================================================
-- RPC: Atomic message queue claim (FOR UPDATE SKIP LOCKED)
-- Used by queue-worker Edge Function
-- ============================================================
CREATE OR REPLACE FUNCTION claim_message_jobs(worker_limit INT DEFAULT 20)
RETURNS SETOF message_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM message_queue
    WHERE status = 'pending'
      AND (scheduled_at IS NULL OR scheduled_at <= now())
    ORDER BY scheduled_at ASC NULLS LAST
    LIMIT worker_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE message_queue mq
  SET status = 'processing'
  FROM claimed
  WHERE mq.id = claimed.id
  RETURNING mq.*;
END;
$$;
