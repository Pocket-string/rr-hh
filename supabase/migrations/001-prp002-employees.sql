-- PRP-002 Fase 1: Maestro de Empleados + Estructura Organizativa
-- Ejecutar en Supabase SQL Editor

-- Departamentos
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  manager_employee_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON departments
  FOR ALL USING (auth.role() = 'authenticated');

-- Centros de coste
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  percentage DECIMAL(5,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON cost_centers
  FOR ALL USING (auth.role() = 'authenticated');

-- Maestro de empleados
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nif TEXT,
  email TEXT,
  phone TEXT,
  department_id UUID REFERENCES departments(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  hire_date DATE,
  termination_date DATE,
  contract_type TEXT,
  base_salary DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users" ON employees
  FOR ALL USING (auth.role() = 'authenticated');

-- FK circular: manager de departamento -> empleado
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
  FOREIGN KEY (manager_employee_id) REFERENCES employees(id);

-- Indices
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_cost_center ON employees(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_cost_centers_department ON cost_centers(department_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
