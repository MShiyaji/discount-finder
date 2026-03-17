-- Create enum type for discount categories
DO $$ BEGIN
  CREATE TYPE discount_type AS ENUM (
    'student',        -- Educational discounts (.edu, student ID)
    'military',       -- Veterans, active duty
    'nonprofit',      -- 501c3, charity discounts
    'seasonal',       -- Black Friday, summer sales, holiday deals
    'bundle',         -- Included with carrier (Verizon, T-Mobile), other services
    'referral',       -- Referral program benefits
    'free_tier',      -- Free tier or freemium option
    'credit_card',    -- Credit card company perks (Chase, Amex)
    'employer',       -- Corporate/enterprise discounts
    'loyalty',        -- Retention offers, long-term subscriber deals
    'regional',       -- Cheaper in certain regions/countries
    'first_time'      -- New customer discounts, trials
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the discounts table to store discount information
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  discount_type discount_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_amount TEXT, -- e.g., "50% off", "Free", "$5/mo", "3 months free"
  eligibility TEXT, -- Who qualifies for this discount
  how_to_claim TEXT, -- Steps to get the discount
  source_url TEXT, -- Where this info was found
  valid_from DATE, -- Start date (for seasonal)
  valid_to DATE, -- End date (for seasonal)
  recurrence TEXT, -- e.g., "Annual (Black Friday)", "Ongoing"
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1), -- AI confidence score
  verified BOOLEAN DEFAULT FALSE, -- Manually verified by admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_discounts_service_id ON discounts(service_id);
CREATE INDEX IF NOT EXISTS idx_discounts_type ON discounts(discount_type);
CREATE INDEX IF NOT EXISTS idx_discounts_verified ON discounts(verified);
CREATE INDEX IF NOT EXISTS idx_discounts_confidence ON discounts(confidence DESC);

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_discounts_updated_at ON discounts;
CREATE TRIGGER update_discounts_updated_at
  BEFORE UPDATE ON discounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a unique constraint to prevent duplicate discounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_discounts_unique 
ON discounts(service_id, discount_type, COALESCE(title, ''));
