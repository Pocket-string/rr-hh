# PRP-001: Automatizacion de Imputacion Contable de Nominas

> **Estado**: PENDIENTE
> **Fecha**: 2026-03-26
> **Proyecto**: Peixos Puignau S.A.

---

## Objetivo

Automatizar la recepcion, normalizacion y procesamiento del IC (Informe Contable) de nominas de Peixos Puignau: desde la carga del Excel hasta la generacion del asiento contable y envio de la prenomina por correo electronico.

## Por Que

| Problema | Solucion |
|----------|----------|
| Proceso manual de 10-15 dias/mes con riesgo de errores | Automatizacion reduce a minutos con validacion integrada |
| Sin trazabilidad de cambios ni auditoria | Log completo de cada paso del proceso |
| Cuello de botella operativo al cierre de mes | Flujo automatizado elimina dependencia manual |
| Alta carga de transformacion de datos entre Excel/SQL Server/correo | Pipeline automatico end-to-end |

**Valor de negocio**: Reduccion de ~10 dias de trabajo manual a minutos. Eliminacion de errores de transcripcion. Trazabilidad total para auditoria.

## Que

### Criterios de Exito
- [ ] Upload de Excel IC y parsing automatico sin errores
- [ ] Datos normalizados visibles en dashboard (empleados, conceptos, importes)
- [ ] Mapping concepto → subcuenta contable aplicado correctamente
- [ ] Asiento contable generado automaticamente
- [ ] Prenomina enviada por email a destinatarios configurados
- [ ] Trazabilidad total del proceso (quien, cuando, que)

### Comportamiento Esperado
1. Usuario sube archivo Excel IC mensual (formato gestoria)
2. Sistema parsea y valida estructura (periodo, empleados, conceptos)
3. Datos normalizados se cargan en Supabase + SQL Server
4. Motor de reglas aplica mapping contable por departamento/centro de coste
5. Se genera asiento contable (con fallback si no hay asignacion de departamento)
6. Se envia prenomina por correo electronico
7. Todo queda registrado con trazabilidad completa

---

## Contexto

### Cliente
- **Empresa:** Peixos Puignau S.A. (NIF: A17216359)
- **Ubicacion:** Pol. Ind. Casa Nova, c/Tarragona, 69-70, 17181 Aiguaviva, Girona
- **Sector:** Alimentacion (pescado fresco, elaborado, congelado)
- **Contacto:** Loreto Basaure, Directora RRHH (loreto.basaure@peixospuignau.net)
- **Partner tecnico:** Enric Paredes, NowTech (enric.paredes@nowtechsite.com)

### Flujo Actual (AS-IS)
1. Confirmacion de horas y ajustes (validar fichajes)
2. Solicitud de objetivos a responsables de equipo (email + Excel)
3. Preparacion de bestretes (dias 10-15, efectivo dia 25)
4. Envio de info a gestoria (Excel normalizado, dias 10-15)
5. Gestoria prepara nominas → dia 28: IC temporal disponible
6. Consulta contraparte de imputacion (% por centro de coste)
7. Construccion imputacion contable (mapping conceptos → subcuentas)
8. IC definitivo

### Estructura del Excel IC (Ejemplo: Febrero 2026)
- **Hoja 1:** Datos individuales (~112 empleados en columnas, ~40 conceptos en filas)
  - Fila 4: Codigos de empleado (000002, 000006, ..., 100542)
  - Filas 5-7: Apellidos y nombre
  - Filas 11-44: Conceptos salariales (codigo + nombre + importe)
  - Fila 46: TOTAL BRUT
  - Filas 48-50: Deducciones
- **Hoja 2:** Resumen totales (mismos conceptos, suma global)
- **Total Bruto Feb 2026:** 251,648.05 EUR

### Conceptos salariales principales
| Codigo | Concepto | Tipo |
|--------|----------|------|
| 1 | SALARI BASE | Devengo |
| 74 | PRESENCIA I IMATGE | Plus |
| 75 | PLUS PERILLOSITAT | Plus |
| 85 | PLUS RESPONSABILITAT | Plus |
| 93 | PLUS DISPONIBILITAT | Plus |
| 113 | REGULARITZACIO | Ajuste |
| 131 | MILLORA SALARIAL ABSORBIBLE | Devengo |
| 173-175 | PP PAGA ESTIU/NADAL/BENEFICIS | Prorrateo |
| 187 | PLUS NOCTURNITAT | Plus |
| 197 | A CTE CONVENI | Devengo |
| 287 | PAGA FIDELITAT | Devengo |
| 365 | COMISSIONS | Variable |
| 397 | PLUS DISTANCIA | Plus |
| 450-455 | IT/MALALTIA/ACCIDENT/COMPLEMENT | Incapacidad |
| 703 | EMBARGO SALARIAL | Deduccion |
| 704 | DESCOMPTE PRESTEC | Deduccion |
| 724 | BESTRETA | Deduccion |

### Herramientas actuales
- Excel (IC de la gestoria)
- SQL Server (carga de datos contables)
- Correo electronico (envio de prenomina)

### Referencias
- `docs/info/correo.solicitud.automatizacion.pdf` — Hilo de correos con el flujo detallado
- `docs/info/Automatitzacio_de_Imputacio_Comptable_PeixosPuignau.png` — Infografia AS-IS vs TO-BE
- `docs/info/Resum nomines 02.2026-PEIXOS PUIGNAU-DEFINITIU-2.xlsx` — Ejemplo real de IC

### Arquitectura Propuesta (Feature-First)
```
src/features/
├── ic-upload/          # Carga y parsing del Excel IC
│   ├── components/     # Dropzone, preview, validation UI
│   ├── services/       # Excel parser, validator
│   ├── hooks/
│   └── types/          # ICRow, ICConcept, ICEmployee
│
├── ic-viewer/          # Visualizacion de datos cargados
│   ├── components/     # Tablas, filtros, resumen
│   └── hooks/
│
├── accounting-rules/   # Motor de reglas contables
│   ├── components/     # Editor de reglas, mapping table
│   ├── services/       # Rule engine, fallback logic
│   └── types/          # Rule, Mapping, AccountEntry
│
├── accounting-entry/   # Generacion del asiento contable
│   ├── components/     # Vista del asiento, export
│   └── services/       # Entry builder, SQL Server sync
│
└── payroll-email/      # Envio de prenomina
    ├── components/     # Preview email, recipients config
    └── services/       # Email sender (Resend)
```

### Modelo de Datos

**Supabase (PostgreSQL) — App web, config, logs:**
```sql
-- Archivos IC subidos
CREATE TABLE ic_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  employee_count INT,
  total_brut DECIMAL(12,2),
  status TEXT DEFAULT 'uploaded', -- uploaded, validated, processed, sent
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ic_uploads ENABLE ROW LEVEL SECURITY;

-- Empleados extraidos del IC
CREATE TABLE ic_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES ic_uploads(id) ON DELETE CASCADE,
  employee_code TEXT NOT NULL,
  last_name TEXT,
  first_name TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ic_employees ENABLE ROW LEVEL SECURITY;

-- Lineas del IC (concepto x empleado)
CREATE TABLE ic_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES ic_uploads(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES ic_employees(id) ON DELETE CASCADE,
  concept_code INT NOT NULL,
  concept_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ic_lines ENABLE ROW LEVEL SECURITY;

-- Reglas de mapping contable
CREATE TABLE accounting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_code INT NOT NULL,
  concept_name TEXT NOT NULL,
  account_code TEXT NOT NULL,
  department TEXT,          -- NULL = aplica a todos
  debit_credit TEXT NOT NULL CHECK (debit_credit IN ('D', 'H')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounting_rules ENABLE ROW LEVEL SECURITY;

-- Asientos contables generados
CREATE TABLE accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES ic_uploads(id),
  entry_date DATE NOT NULL,
  description TEXT,
  total_debit DECIMAL(12,2),
  total_credit DECIMAL(12,2),
  status TEXT DEFAULT 'draft', -- draft, confirmed, synced
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- Lineas del asiento
CREATE TABLE accounting_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES accounting_entries(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  description TEXT,
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  department TEXT
);
ALTER TABLE accounting_entry_lines ENABLE ROW LEVEL SECURITY;
```

**SQL Server — Datos contables del cliente (sincronizacion):**
Estructura a definir segun acceso y esquema existente del cliente.

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo definir FASES. Las subtareas se generan al entrar a cada fase
> siguiendo el bucle agentico (mapear contexto → generar subtareas → ejecutar)

### Fase 1: Ingesta y Normalizacion del IC
**Objetivo**: Subir Excel IC → parsear → validar → almacenar normalizado → visualizar
**Incluye**: Upload UI (dropzone), parser xlsx, validacion de estructura, tablas en Supabase, viewer basico con tabla de empleados y conceptos
**Validacion**: Usuario sube el IC de Feb 2026 y ve los 112 empleados con sus 40 conceptos y totales correctos

### Fase 2: Motor de Reglas Contables
**Objetivo**: CRUD de reglas de mapping contable + aplicacion automatica
**Incluye**: UI para definir reglas (concepto → subcuenta), engine que aplica mapping, logica de fallback por departamento
**Validacion**: Dado un IC cargado + reglas definidas, se genera el mapping correcto para cada linea
**Requiere**: Reglas de mapping del cliente (reunion 2026-03-31)

### Fase 3: Generacion de Asiento Contable
**Objetivo**: Generar asiento contable completo + sincronizar con SQL Server del cliente
**Incluye**: Builder de asiento (debe/haber), conexion mssql, export, vista de asiento generado
**Validacion**: Asiento generado coincide con el que haria manualmente RRHH

### Fase 4: Envio de Prenomina y Trazabilidad
**Objetivo**: Email automatizado de prenomina + dashboard de trazabilidad
**Incluye**: Templates de email (Resend/React Email), configuracion de destinatarios, log completo, dashboard de estado por periodo
**Validacion**: Email recibido con formato correcto, historial completo visible en dashboard

### Fase 5: Validacion Final
**Objetivo**: Sistema funcionando end-to-end con datos reales
**Validacion**:
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm build` exitoso
- [ ] Upload de IC real procesado correctamente
- [ ] Asiento contable verificado por RRHH
- [ ] Email de prenomina recibido
- [ ] Criterios de exito cumplidos

---

## Aprendizajes (Self-Annealing)

> Esta seccion CRECE con cada error encontrado durante la implementacion.

*(Vacio — se completara durante la implementacion)*

---

## Informacion Pendiente (Reunion 2026-03-31)

1. **Reglas de mapping contable** — Que concepto salarial va a que subcuenta contable? Varia por departamento?
2. **Lista de departamentos/centros de coste** — Cuantos son? Como se asignan empleados a departamentos?
3. **Formato de salida del asiento contable** — Como debe verse el IC definitivo? Que formato espera SQL Server?
4. **Acceso a SQL Server** — Credenciales, host, esquema de tablas existente
5. **Email de prenomina** — Que informacion lleva? A quien se envia? Que formato?

## Gotchas

- [ ] El Excel IC tiene encoding catalan (caracteres especiales: ç, ò, ú, etc.)
- [ ] Los codigos de empleado pueden empezar con 0 (ej: "000002") — tratar como TEXT, no INT
- [ ] Algunos empleados no tienen todos los conceptos (celdas vacias = 0)
- [ ] La Hoja 2 es un resumen de totales — util para validacion cruzada
- [ ] Conexion a SQL Server del cliente requiere VPN o acceso de red especifico (por confirmar)

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan
- NO ignorar errores de TypeScript
- NO hardcodear reglas de mapping (deben ser configurables via UI)
- NO omitir validacion Zod en inputs de usuario
- NO asumir estructura fija del Excel (validar siempre)

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
