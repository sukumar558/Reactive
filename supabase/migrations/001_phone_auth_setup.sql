-- ============================================
-- ReActivate AI — Phone Auth Backend Setup
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================
-- 1. Create ra_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS public.ra_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT,
  shop_name TEXT,
  business_type TEXT DEFAULT 'General',
  phone TEXT,
  avg_order_value NUMERIC DEFAULT 1000,
  automation_active BOOLEAN DEFAULT false,
  api_mode_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- 2. Add business_type column if table already exists
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'ra_profiles'
    AND column_name = 'business_type'
) THEN
ALTER TABLE public.ra_profiles
ADD COLUMN business_type TEXT DEFAULT 'General';
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'ra_profiles'
    AND column_name = 'phone'
) THEN
ALTER TABLE public.ra_profiles
ADD COLUMN phone TEXT;
END IF;
END $$;
-- 3. Enable RLS
ALTER TABLE public.ra_profiles ENABLE ROW LEVEL SECURITY;
-- 4. RLS Policies — users can only access their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.ra_profiles;
CREATE POLICY "Users can view own profile" ON public.ra_profiles FOR
SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.ra_profiles;
CREATE POLICY "Users can insert own profile" ON public.ra_profiles FOR
INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.ra_profiles;
CREATE POLICY "Users can update own profile" ON public.ra_profiles FOR
UPDATE USING (auth.uid() = id);
-- 5. Create ra_customers table (if not exists)
CREATE TABLE IF NOT EXISTS public.ra_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  last_purchase_date DATE,
  total_purchases NUMERIC DEFAULT 0,
  tags TEXT [] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ra_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own customers" ON public.ra_customers;
CREATE POLICY "Users can view own customers" ON public.ra_customers FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own customers" ON public.ra_customers;
CREATE POLICY "Users can insert own customers" ON public.ra_customers FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own customers" ON public.ra_customers;
CREATE POLICY "Users can update own customers" ON public.ra_customers FOR
UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own customers" ON public.ra_customers;
CREATE POLICY "Users can delete own customers" ON public.ra_customers FOR DELETE USING (auth.uid() = user_id);
-- 6. Create ra_campaigns table (if not exists)
CREATE TABLE IF NOT EXISTS public.ra_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_template TEXT,
  trigger_type TEXT,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ra_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.ra_campaigns;
CREATE POLICY "Users can view own campaigns" ON public.ra_campaigns FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own campaigns" ON public.ra_campaigns;
CREATE POLICY "Users can insert own campaigns" ON public.ra_campaigns FOR
INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.ra_campaigns;
CREATE POLICY "Users can update own campaigns" ON public.ra_campaigns FOR
UPDATE USING (auth.uid() = user_id);
-- 7. Create ra_campaign_customers junction table
CREATE TABLE IF NOT EXISTS public.ra_campaign_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ra_campaigns(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.ra_customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ra_campaign_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own campaign customers" ON public.ra_campaign_customers;
CREATE POLICY "Users can view own campaign customers" ON public.ra_campaign_customers FOR
SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.ra_campaigns
      WHERE ra_campaigns.id = ra_campaign_customers.campaign_id
        AND ra_campaigns.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can insert own campaign customers" ON public.ra_campaign_customers;
CREATE POLICY "Users can insert own campaign customers" ON public.ra_campaign_customers FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ra_campaigns
      WHERE ra_campaigns.id = ra_campaign_customers.campaign_id
        AND ra_campaigns.user_id = auth.uid()
    )
  );
-- 8. Auto-save phone number to profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.ra_profiles (id, phone, owner_name)
VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  ) ON CONFLICT (id) DO
UPDATE
SET phone = EXCLUDED.phone,
  updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Create trigger
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 9. Updated_at auto-update function
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply to all tables
DROP TRIGGER IF EXISTS update_ra_profiles_updated_at ON public.ra_profiles;
CREATE TRIGGER update_ra_profiles_updated_at BEFORE
UPDATE ON public.ra_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_ra_customers_updated_at ON public.ra_customers;
CREATE TRIGGER update_ra_customers_updated_at BEFORE
UPDATE ON public.ra_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_ra_campaigns_updated_at ON public.ra_campaigns;
CREATE TRIGGER update_ra_campaigns_updated_at BEFORE
UPDATE ON public.ra_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
-- Done! ✅
SELECT 'Backend setup complete! All tables, RLS policies, and triggers are ready.' AS status;