-- ============================================================
-- ReActivate AI — Production Schema v1
-- Complete multi-tenant SaaS backend
-- Applied: 2026-04-19
-- ============================================================

-- ────────────────────────────────────────────
-- PHASE 1: Drop legacy ra_ tables
-- ────────────────────────────────────────────
DROP TABLE IF EXISTS ra_campaign_customers CASCADE;
DROP TABLE IF EXISTS ra_message_history CASCADE;
DROP TABLE IF EXISTS ra_inbound_messages CASCADE;
DROP TABLE IF EXISTS ra_campaigns CASCADE;
DROP TABLE IF EXISTS ra_customers CASCADE;
DROP TABLE IF EXISTS ra_profiles CASCADE;
DROP TABLE IF EXISTS message_queue CASCADE;
DROP TABLE IF EXISTS data_sources CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;

-- ────────────────────────────────────────────
-- PHASE 2: Create production tables
-- ────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name TEXT,
  owner_name TEXT,
  phone TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  item_name TEXT,
  brand TEXT,
  category TEXT,
  purchase_date DATE,
  purchase_amount NUMERIC DEFAULT 0,
  last_purchase_date DATE,
  last_service_date DATE,
  warranty_end_date DATE,
  total_spend NUMERIC DEFAULT 0,
  purchase_count INT DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_name TEXT,
  source TEXT,
  total_rows INT DEFAULT 0,
  success_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  duplicate_rows INT DEFAULT 0,
  status TEXT DEFAULT 'processing',
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  campaign_name TEXT NOT NULL,
  priority INT DEFAULT 1,
  message_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE customer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  reason TEXT,
  score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  revenue_generated NUMERIC DEFAULT 0
);

CREATE TABLE message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  phone TEXT,
  message TEXT,
  provider TEXT,
  status TEXT DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  provider_response TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  payment_ref TEXT
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT,
  action TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────
-- PHASE 3: Performance Indexes
-- ────────────────────────────────────────────
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_purchase_date ON customers(purchase_date);
CREATE INDEX idx_customers_user_phone ON customers(user_id, phone);
CREATE INDEX idx_customers_user_purchase_date ON customers(user_id, purchase_date);
CREATE UNIQUE INDEX idx_customers_user_phone_unique ON customers(user_id, phone);

CREATE INDEX idx_imports_user_id ON imports(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);

CREATE INDEX idx_cc_user_id ON customer_campaigns(user_id);
CREATE INDEX idx_cc_customer_id ON customer_campaigns(customer_id);
CREATE INDEX idx_cc_campaign_id ON customer_campaigns(campaign_id);
CREATE INDEX idx_cc_user_status ON customer_campaigns(user_id, status);

CREATE INDEX idx_mq_user_id ON message_queue(user_id);
CREATE INDEX idx_mq_status ON message_queue(status);
CREATE INDEX idx_mq_scheduled_at ON message_queue(scheduled_at);
CREATE INDEX idx_mq_user_status ON message_queue(user_id, status);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_activity_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- ────────────────────────────────────────────
-- PHASE 4: Row Level Security
-- ────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- profiles uses id = auth.uid()
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (id = auth.uid());

-- all other tables use user_id = auth.uid()
CREATE POLICY "customers_select" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "imports_select" ON imports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "imports_insert" ON imports FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "imports_update" ON imports FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "imports_delete" ON imports FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "campaigns_select" ON campaigns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "campaigns_insert" ON campaigns FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "campaigns_update" ON campaigns FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "campaigns_delete" ON campaigns FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "cc_select" ON customer_campaigns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cc_insert" ON customer_campaigns FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cc_update" ON customer_campaigns FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cc_delete" ON customer_campaigns FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "mq_select" ON message_queue FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "mq_insert" ON message_queue FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "mq_update" ON message_queue FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "mq_delete" ON message_queue FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "sub_select" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "sub_insert" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "sub_update" ON subscriptions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "sub_delete" ON subscriptions FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "logs_select" ON activity_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "logs_update" ON activity_logs FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "logs_delete" ON activity_logs FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- PHASE 5: Automation Helpers
-- ────────────────────────────────────────────

-- Auto-update updated_at on customers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create profiles row after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, owner_name, phone, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, ''),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
