-- Migration: IC Upload tables (migrated from SQL Server to Supabase)
-- These tables store parsed payroll IC files from the gestoria

-- 1. IC Uploads (header/metadata)
CREATE TABLE IF NOT EXISTS ic_uploads (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_type TEXT,
  currency TEXT DEFAULT 'EUR',
  company_name TEXT NOT NULL,
  company_nif TEXT NOT NULL,
  employee_count INTEGER NOT NULL DEFAULT 0,
  total_brut NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'validated', 'processed', 'sent')),
  created_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. IC Employees (employees found in the IC file)
CREATE TABLE IF NOT EXISTS ic_employees (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER NOT NULL REFERENCES ic_uploads(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  department TEXT,
  cost_center TEXT
);

CREATE INDEX idx_ic_employees_upload ON ic_employees(upload_id);

-- 3. IC Lines (salary concept lines per employee)
CREATE TABLE IF NOT EXISTS ic_lines (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER NOT NULL REFERENCES ic_uploads(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  concept_code INTEGER NOT NULL,
  concept_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  concept_type TEXT
);

CREATE INDEX idx_ic_lines_upload ON ic_lines(upload_id);
CREATE INDEX idx_ic_lines_concept ON ic_lines(upload_id, concept_code);

-- 4. RLS Policies
ALTER TABLE ic_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ic_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ic_lines ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "ic_uploads_auth" ON ic_uploads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ic_employees_auth" ON ic_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ic_lines_auth" ON ic_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow service role full access (for API routes)
CREATE POLICY "ic_uploads_service" ON ic_uploads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ic_employees_service" ON ic_employees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "ic_lines_service" ON ic_lines FOR ALL TO service_role USING (true) WITH CHECK (true);
