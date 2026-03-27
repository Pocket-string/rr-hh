-- =============================================
-- PRP-001: Automatizacion IC Peixos Puignau
-- Tablas para ingesta, reglas y asientos contables
-- =============================================

-- Uploads de IC
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ic_uploads')
CREATE TABLE ic_uploads (
  id INT IDENTITY(1,1) PRIMARY KEY,
  filename NVARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_type NVARCHAR(100),
  currency NVARCHAR(10) DEFAULT 'EUR',
  company_name NVARCHAR(255),
  company_nif NVARCHAR(20),
  employee_count INT,
  total_brut DECIMAL(14,2),
  status NVARCHAR(20) DEFAULT 'uploaded',
  created_at DATETIME2 DEFAULT GETDATE(),
  created_by NVARCHAR(255)
);

-- Empleados extraidos del IC
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ic_employees')
CREATE TABLE ic_employees (
  id INT IDENTITY(1,1) PRIMARY KEY,
  upload_id INT NOT NULL REFERENCES ic_uploads(id) ON DELETE CASCADE,
  employee_code NVARCHAR(10) NOT NULL,
  last_name NVARCHAR(255),
  first_name NVARCHAR(255),
  department NVARCHAR(100),
  cost_center NVARCHAR(50)
);

-- Lineas del IC (concepto x empleado)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ic_lines')
CREATE TABLE ic_lines (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  upload_id INT NOT NULL REFERENCES ic_uploads(id) ON DELETE CASCADE,
  employee_code NVARCHAR(10) NOT NULL,
  concept_code INT NOT NULL,
  concept_name NVARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  concept_type NVARCHAR(20)
);

-- Reglas de mapping contable
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accounting_rules')
CREATE TABLE accounting_rules (
  id INT IDENTITY(1,1) PRIMARY KEY,
  concept_code INT NOT NULL,
  concept_name NVARCHAR(255),
  account_code NVARCHAR(20) NOT NULL,
  department NVARCHAR(100),
  cost_center NVARCHAR(50),
  debit_credit CHAR(1) NOT NULL CHECK (debit_credit IN ('D', 'H')),
  is_active BIT DEFAULT 1,
  description NVARCHAR(500),
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Asientos contables generados
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accounting_entries')
CREATE TABLE accounting_entries (
  id INT IDENTITY(1,1) PRIMARY KEY,
  upload_id INT NOT NULL REFERENCES ic_uploads(id),
  entry_date DATE NOT NULL,
  description NVARCHAR(500),
  total_debit DECIMAL(14,2),
  total_credit DECIMAL(14,2),
  status NVARCHAR(20) DEFAULT 'draft',
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Lineas del asiento contable
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accounting_entry_lines')
CREATE TABLE accounting_entry_lines (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  entry_id INT NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
  account_code NVARCHAR(20) NOT NULL,
  description NVARCHAR(500),
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  department NVARCHAR(100),
  cost_center NVARCHAR(50),
  employee_code NVARCHAR(10)
);

-- Indices
CREATE INDEX IX_ic_employees_upload ON ic_employees(upload_id);
CREATE INDEX IX_ic_lines_upload ON ic_lines(upload_id);
CREATE INDEX IX_ic_lines_employee ON ic_lines(employee_code);
CREATE INDEX IX_accounting_rules_concept ON accounting_rules(concept_code);
CREATE INDEX IX_accounting_entry_lines_entry ON accounting_entry_lines(entry_id);
