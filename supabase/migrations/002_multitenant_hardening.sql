-- ============================================
-- ReActivate AI — Multi-Tenant Isolation Hardening
-- Migration: Rename item → item_name, add missing columns, add composite unique key
-- ============================================

-- 1. Rename 'item' column to 'item_name' to match all application code
ALTER TABLE public.ra_customers RENAME COLUMN item TO item_name;

-- 2. Add missing columns needed by the AI Campaign Engine
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 1;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS visit_frequency INTEGER DEFAULT 0;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS complaint_count INTEGER DEFAULT 0;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS warranty_end_date DATE;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS purchase_amount NUMERIC DEFAULT 0;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS assigned_campaign TEXT;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS messages_responded INTEGER DEFAULT 0;
ALTER TABLE public.ra_customers ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- 3. Update unique constraint for proper tenant-scoped deduplication
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.ra_customers DROP CONSTRAINT IF EXISTS ra_customers_phone_item_purchase_date_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE public.ra_customers DROP CONSTRAINT IF EXISTS ra_customers_user_id_phone_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE public.ra_customers
  ADD CONSTRAINT ra_customers_user_id_phone_item_name_purchase_date_key
  UNIQUE (user_id, phone, item_name, purchase_date);
