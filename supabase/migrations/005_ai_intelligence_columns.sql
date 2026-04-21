-- Add AI Intelligence columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS price_segment TEXT,
ADD COLUMN IF NOT EXISTS campaign_tags TEXT[],
ADD COLUMN IF NOT EXISTS confidence_score INT,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upgrade_cycle_months INT,
ADD COLUMN IF NOT EXISTS clean_item_name TEXT,
ADD COLUMN IF NOT EXISTS raw_item_name TEXT;

-- Update existing records to have a default value for needs_review
UPDATE customers SET needs_review = false WHERE needs_review IS NULL;
