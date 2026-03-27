# PRP-002: Plataforma SaaS de Nominas Peixos Puignau

> **Estado**: APROBADO
> **Fecha**: 2026-03-26
> **Proyecto**: Peixos Puignau S.A.
> **Depende de**: PRP-001 (Fase 1 completada)

---

## Objetivo

Evolucionar de "procesar un Excel IC externo" a una plataforma digital completa de gestion de nominas donde Peixos Puignau captura, calcula y gestiona toda la informacion salarial internamente, eliminando la dependencia del Excel de la gestoria como cuello de botella.

## Por Que

| Problema | Solucion |
|----------|----------|
| Dependencia total del Excel de la gestoria (llega el dia 28, bloquea todo) | La empresa captura datos variables durante el mes, el IC se genera internamente |
| Los datos variables (horas extras, objetivos, bestretes) se gestionan en papeles/emails | Captura digital estructurada con flujos de aprobacion |
| No hay maestro de empleados propio, dependen del Excel de gestoria | Base de datos propia de empleados con departamentos, centros de coste, contratos |
| Los conceptos salariales no estan formalizados digitalmente | Catalogo configurable de conceptos con tipos, cuentas contables y reglas |
| El IC solo existe como snapshot mensual sin trazabilidad incremental | Generacion automatica del IC con datos capturados + reglas contables |

**Valor de negocio**: Autonomia total en la gestion de nominas. El Excel de la gestoria pasa de ser el input principal a ser un documento de validacion/reconciliacion. Reduccion del ciclo de cierre de 10-15 dias a 2-3 dias.

## Que

### Criterios de Exito
- [ ] Maestro de empleados completo (datos personales, departamento, centro de coste, contrato)
- [ ] Catalogo de conceptos salariales configurable (codigo, nombre, tipo, cuenta contable)
- [ ] Captura digital de datos variables del mes (horas extras, objetivos, bestretes, incidencias)
- [ ] Generacion automatica del IC a partir de datos fijos + variables + reglas
- [ ] Reglas contables aplicadas automaticamente (concepto + departamento → subcuenta)
- [ ] Asiento contable generado sin intervencion manual
- [ ] Envio de prenomina por email
- [ ] Reconciliacion: comparar IC generado vs Excel de gestoria para detectar diferencias

### Comportamiento Esperado (Happy Path)
1. **Inicio de mes**: RRHH revisa el maestro de empleados (altas, bajas, cambios de departamento)
2. **Durante el mes**: Responsables de equipo cargan datos variables (horas extras, objetivos, incidencias)
3. **Dias 10-15**: RRHH registra bestretes y revisa datos acumulados
4. **Dia 20-25**: Sistema genera IC automatico con datos fijos (salario base, pluses) + variables capturados
5. **Dia 28**: Llega Excel de gestoria → sistema compara automaticamente con IC interno → muestra diferencias
6. **Cierre**: Motor de reglas genera asiento contable → se envia prenomina por email
7. **Todo queda trazado**: quien capturo que, cuando, aprobaciones, historico

---

## Contexto

### Relacion con PRP-001
PRP-001 resuelve la ingesta del Excel. PRP-002 **extiende** el sistema para que la informacion no necesite venir del Excel:
- PRP-001: Excel → Parse → DB → Asiento → Email (reactivo)
- PRP-002: Maestro + Captura Variables + Reglas → IC generado → Asiento → Email (proactivo)

El Excel de la gestoria pasa de ser **input obligatorio** a ser **documento de reconciliacion**.

### Decision Arquitectonica
**BD**: Supabase (PostgreSQL) como BD principal mientras esperamos credenciales SQL Server del cliente.

### Arquitectura Propuesta (Feature-First)
```
src/features/
├── employees/              # NUEVO - Maestro de empleados
│   ├── components/         # UI de la feature
│   ├── services/           # CRUD empleados Supabase
│   └── types/
│
├── salary-concepts/        # NUEVO - Catalogo de conceptos salariales
│   ├── components/
│   ├── services/
│   └── types/
│
├── variable-data/          # NUEVO - Captura de datos variables del mes
│   ├── components/
│   ├── services/
│   └── types/
│
├── ic-generator/           # NUEVO - Generacion automatica del IC
│   ├── components/         # Preview del IC generado, comparador
│   ├── services/           # Calculo IC, reconciliacion vs Excel
│   └── types/
│
├── ic-upload/              # EXISTENTE (PRP-001) — Ingesta Excel
├── ic-viewer/              # EXISTENTE — Visualizacion
├── accounting-rules/       # EXISTENTE (pendiente) — Motor de reglas
├── accounting-entry/       # EXISTENTE (pendiente) — Asientos
└── payroll-email/          # EXISTENTE (pendiente) — Email prenomina
```

---

## Modelo de Datos (8 tablas nuevas en Supabase)

```sql
-- Departamentos
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  manager_employee_id UUID,  -- FK agregada despues por dependencia circular
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Centros de coste
CREATE TABLE cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  percentage DECIMAL(5,2) DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

-- Maestro de empleados
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT NOT NULL UNIQUE,      -- "000002" con ceros
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nif TEXT,
  email TEXT,
  phone TEXT,
  department_id UUID REFERENCES departments(id),
  cost_center_id UUID REFERENCES cost_centers(id),
  hire_date DATE,
  termination_date DATE,                   -- NULL = activo
  contract_type TEXT,                       -- indefinido, temporal, etc.
  base_salary DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- FK circular: manager de departamento
ALTER TABLE departments ADD CONSTRAINT fk_manager
  FOREIGN KEY (manager_employee_id) REFERENCES employees(id);

-- Catalogo de conceptos salariales
CREATE TABLE salary_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code INT NOT NULL UNIQUE,                -- 1, 74, 75...
  name TEXT NOT NULL,                      -- "SALARI BASE", "PLUS PERILLOSITAT"
  category TEXT NOT NULL,                  -- devengo, plus, prorrateo, variable, incapacidad, deduccion
  is_fixed BOOLEAN DEFAULT true,           -- true = contractual, false = variable mensual
  default_account_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE salary_concepts ENABLE ROW LEVEL SECURITY;

-- Conceptos fijos asignados a empleados (pluses del contrato)
CREATE TABLE employee_fixed_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES salary_concepts(id),
  amount DECIMAL(12,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,                       -- NULL = vigente
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE employee_fixed_concepts ENABLE ROW LEVEL SECURITY;

-- Datos variables mensuales (horas extras, objetivos, bestretes)
CREATE TABLE monthly_variable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES salary_concepts(id),
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  quantity DECIMAL(8,2),                   -- Ej: numero de horas extras
  notes TEXT,
  status TEXT DEFAULT 'draft',             -- draft, submitted, approved, rejected
  submitted_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, concept_id, period_year, period_month)
);
ALTER TABLE monthly_variable_data ENABLE ROW LEVEL SECURITY;

-- ICs generados internamente
CREATE TABLE generated_ics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  employee_count INT,
  total_brut DECIMAL(12,2),
  status TEXT DEFAULT 'draft',             -- draft, reviewed, approved, reconciled
  generated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  reconciliation_diff JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE generated_ics ENABLE ROW LEVEL SECURITY;

-- Lineas del IC generado
CREATE TABLE generated_ic_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_ic_id UUID REFERENCES generated_ics(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  concept_id UUID REFERENCES salary_concepts(id),
  amount DECIMAL(12,2) NOT NULL,
  source TEXT NOT NULL,                    -- 'fixed', 'variable', 'calculated'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE generated_ic_lines ENABLE ROW LEVEL SECURITY;
```

---

## Blueprint (Assembly Line)

### Fase 1: Maestro de Empleados + Estructura Organizativa
**Objetivo**: CRUD completo de empleados, departamentos y centros de coste con datos reales de Peixos Puignau
**Validacion**: Los ~112 empleados estan cargados con su departamento y centro de coste asignado. Se puede buscar, filtrar y editar.

### Fase 2: Catalogo de Conceptos Salariales
**Objetivo**: CRUD del catalogo de conceptos (~40 conceptos) con categorizacion (fijo/variable) y asignacion de conceptos fijos a empleados
**Validacion**: Los 40 conceptos del IC estan dados de alta. Cada empleado tiene asignados sus conceptos fijos (salario base, pluses contractuales) con importes.

### Fase 3: Captura de Datos Variables Mensuales
**Objetivo**: Formularios para capturar horas extras, objetivos, bestretes, incidencias por empleado/mes con flujo de aprobacion basico
**Validacion**: Un responsable puede cargar horas extras para su equipo. RRHH puede revisar, aprobar/rechazar. Los datos quedan registrados por periodo.

### Fase 4: Generacion Automatica del IC
**Objetivo**: Motor que combina datos fijos (contratos) + variables (capturados) + reglas para generar el IC completo del mes
**Validacion**: El IC generado para Feb 2026 coincide razonablemente con el Excel real de la gestoria (mismo total bruto, mismos conceptos por empleado).

### Fase 5: Reconciliacion IC Generado vs Excel Gestoria
**Objetivo**: Comparador automatico que cruza el IC generado internamente con el Excel de la gestoria y muestra diferencias
**Validacion**: Se sube el Excel de Feb 2026, el sistema detecta y muestra diferencias concepto a concepto, empleado a empleado.

### Fase 6: Integracion con Motor de Reglas y Asientos (PRP-001 Fases 2-3)
**Objetivo**: Conectar el IC generado con el motor de reglas contables y generacion de asientos
**Validacion**: Del IC generado se produce el asiento contable completo con las reglas de mapping aplicadas.

### Fase 7: Validacion Final
**Objetivo**: Sistema funcionando end-to-end con datos reales
**Validacion**:
- [ ] `pnpm typecheck && pnpm build` pasa
- [ ] Maestro de empleados con datos reales
- [ ] Captura de variables funcional
- [ ] IC generado coincide con Excel de gestoria
- [ ] Asiento contable generado correctamente

---

## Gotchas

- [ ] Los codigos de empleado son TEXT (empiezan con 0): "000002", no 2
- [ ] El Excel IC tiene encoding catalan (caracteres especiales)
- [ ] Algunos empleados tienen pluses que varian por mes — necesita mecanismo de "fijo con excepciones"
- [ ] Las pagas prorrateadas (PP Paga Estiu/Nadal/Beneficis) se calculan como proporcion — requiere formula
- [ ] Los bestretes son anticipos en efectivo (dia 25) — flujo diferente a otros conceptos variables
- [ ] La reconciliacion debe tolerar diferencias de redondeo (centimos)
- [ ] Dependencia circular departments↔employees: crear tablas en orden correcto con ALTER TABLE posterior

## Anti-Patrones

- NO duplicar logica del PRP-001 (reusar parser, viewer, reglas)
- NO hardcodear conceptos salariales (deben ser configurables)
- NO asumir que todos los empleados tienen los mismos conceptos
- NO ignorar validacion Zod en formularios de captura
- NO disenar para un solo periodo — la plataforma debe manejar historico
- NO omitir RLS en las nuevas tablas

---

## Archivos Clave

### Nuevos (~25 archivos)
```
src/features/employees/components/EmployeeList.tsx
src/features/employees/components/EmployeeForm.tsx
src/features/employees/components/EmployeeDetail.tsx
src/features/employees/services/employee-service.ts
src/features/employees/types/index.ts

src/features/salary-concepts/components/ConceptList.tsx
src/features/salary-concepts/components/ConceptForm.tsx
src/features/salary-concepts/services/concept-service.ts
src/features/salary-concepts/types/index.ts

src/features/variable-data/components/VariableDataForm.tsx
src/features/variable-data/components/MonthlyView.tsx
src/features/variable-data/services/variable-service.ts
src/features/variable-data/types/index.ts

src/features/ic-generator/components/ICGeneratorPreview.tsx
src/features/ic-generator/components/ReconciliationView.tsx
src/features/ic-generator/services/ic-generator-service.ts
src/features/ic-generator/types/index.ts

src/app/(main)/employees/page.tsx
src/app/(main)/employees/[id]/page.tsx
src/app/(main)/departments/page.tsx
src/app/(main)/concepts/page.tsx
src/app/(main)/variables/page.tsx
src/app/(main)/ic/generate/page.tsx
```

### Existentes a reusar
- `src/features/ic-upload/services/ic-parser.ts` — Parser Excel (seed empleados/conceptos)
- `src/features/ic-upload/types/index.ts` — Tipos IC
- `src/components/ui/*` — Button, Card, Input, Select, Badge
- `src/lib/supabase/client.ts` — Cliente Supabase
- `src/app/(main)/layout.tsx` — Sidebar (agregar nuevas rutas)

---

*PRP-002 aprobado. Listo para ejecutar con /bucle-agentico.*
