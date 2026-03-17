-- Create enum for job status
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for job type
DO $$ BEGIN
  CREATE TYPE job_type AS ENUM (
    'discovery',  -- Finding new services
    'research'    -- Researching discounts for a service
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the scraper_jobs table to track scraping progress
CREATE TABLE IF NOT EXISTS scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type job_type NOT NULL,
  status job_status DEFAULT 'pending',
  service_id UUID REFERENCES services(id) ON DELETE CASCADE, -- For research jobs
  source TEXT, -- For discovery jobs: producthunt, g2, alternativeto
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  results JSONB, -- Store job results/metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_status ON scraper_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_type ON scraper_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_service_id ON scraper_jobs(service_id);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_created_at ON scraper_jobs(created_at DESC);

-- Create a view for services that need research
CREATE OR REPLACE VIEW services_needing_research AS
SELECT s.*
FROM services s
WHERE s.updated_at < NOW() - INTERVAL '7 days'
   OR NOT EXISTS (
     SELECT 1 FROM discounts d WHERE d.service_id = s.id
   )
ORDER BY s.updated_at ASC
LIMIT 50;
