-- Migration: Create qb_tokens table for storing QuickBooks OAuth tokens
-- This table stores tokens persistently for serverless environments

-- Create the table
CREATE TABLE IF NOT EXISTS qb_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Single row constraint
  tokens JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index on updated_at for potential cleanup queries
CREATE INDEX IF NOT EXISTS idx_qb_tokens_updated_at ON qb_tokens(updated_at);

-- Add a comment to the table
COMMENT ON TABLE qb_tokens IS 'Stores QuickBooks OAuth tokens for serverless deployment';

-- Optional: Enable Row Level Security (RLS) if you want additional security
-- Note: The service role key bypasses RLS, but you can still enable it for client access
-- ALTER TABLE qb_tokens ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy if RLS is enabled (example - adjust based on your needs)
-- CREATE POLICY "Service role can manage tokens" ON qb_tokens
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

