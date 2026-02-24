-- MAKKO INTELLIGENCE - REMITTANCE LOGS TABLE
-- 
-- PURPOSE: Immutable audit trail for MZN → USD conversions
-- 
-- FEATURES:
-- - Every conversion logged with timestamp
-- - FX rate and provider recorded
-- - Supports reconciliation and tax reporting
-- - JSONB metadata for extensibility

-- Create remittance_logs table
CREATE TABLE IF NOT EXISTS remittance_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Amounts
  amount_mzn NUMERIC(12, 2) NOT NULL,
  amount_usd NUMERIC(12, 2) NOT NULL,
  exchange_rate NUMERIC(10, 6) NOT NULL,
  
  -- Provider tracking
  provider TEXT NOT NULL CHECK (provider IN ('CLICKPESA', 'FALLBACK_ER_API', 'FALLBACK_FIXED')),
  
  -- Purpose and context
  purpose TEXT NOT NULL DEFAULT 'COMMISSION_SWEEP',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  rate_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexing for queries
  CONSTRAINT positive_amounts CHECK (amount_mzn > 0 AND amount_usd > 0),
  CONSTRAINT valid_rate CHECK (exchange_rate > 0 AND exchange_rate < 1)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_remittance_logs_created_at 
  ON remittance_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_remittance_logs_provider 
  ON remittance_logs(provider);

CREATE INDEX IF NOT EXISTS idx_remittance_logs_purpose 
  ON remittance_logs(purpose);

-- Create view for aggregated statistics
CREATE OR REPLACE VIEW remittance_stats AS
SELECT 
  COUNT(*) as total_conversions,
  SUM(amount_mzn) as total_mzn,
  SUM(amount_usd) as total_usd,
  AVG(exchange_rate) as avg_exchange_rate,
  MIN(exchange_rate) as min_exchange_rate,
  MAX(exchange_rate) as max_exchange_rate,
  provider,
  DATE_TRUNC('month', created_at) as month
FROM remittance_logs
GROUP BY provider, DATE_TRUNC('month', created_at)
ORDER BY month DESC, provider;

-- Add comment for documentation
COMMENT ON TABLE remittance_logs IS 'Immutable audit trail for MZN → USD currency conversions. Used for remittance bridge and tax reconciliation.';

COMMENT ON COLUMN remittance_logs.provider IS 'FX rate provider: CLICKPESA (primary), FALLBACK_ER_API (secondary), or FALLBACK_FIXED (emergency)';

COMMENT ON COLUMN remittance_logs.rate_timestamp IS 'Timestamp when the FX rate was quoted by the provider';

COMMENT ON COLUMN remittance_logs.metadata IS 'Extensible JSON field for additional context (ride IDs, batch numbers, etc.)';
