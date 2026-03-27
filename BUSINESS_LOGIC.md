# BUSINESS_LOGIC.md - Automatizacion Contable Peixos Puignau

> Generado por SaaS Factory | Fecha: 2026-03-26

## 1. Problema de Negocio

**Dolor:** El proceso de imputacion contable de nominas en Peixos Puignau es completamente manual. Cada mes, la gestoria entrega un archivo Excel (IC - Informe Contable) con ~112 empleados y ~40 conceptos salariales. RRHH debe cargarlo manualmente en SQL Server, aplicar reglas de mapping contable (concepto a subcuenta por departamento), generar el asiento contable y enviar la prenomina por correo.

**Costo actual:**
- ~10-15 dias de proceso manual cada mes
- Alto riesgo de errores de transcripcion entre Excel y SQL Server
- Sin trazabilidad ni auditoria del proceso
- Cuello de botella operativo al cierre de mes
- Logica de imputacion no formalizada, dificultando el control y la visibilidad

## 2. Solucion

**Propuesta de valor:** Una plataforma que automatiza la recepcion, normalizacion y procesamiento del IC de nominas: desde la carga del Excel hasta la generacion del asiento contable y envio de la prenomina.

**Flujo principal (Happy Path):**
1. Usuario sube archivo Excel IC mensual (formato gestoria)
2. Sistema parsea y valida estructura (periodo, empleados, conceptos)
3. Datos normalizados se cargan en base de datos
4. Motor de reglas aplica mapping contable por departamento
5. Se genera asiento contable automaticamente
6. Se envia prenomina por correo electronico
7. Todo queda registrado con trazabilidad completa

## 3. Usuario Objetivo

**Roles:**
- **Directora RRHH (Loreto Basaure)**: Sube el IC mensual, revisa datos, aprueba asiento contable, envia prenomina
- **Administrador**: Configura reglas de mapping contable, gestiona departamentos y centros de coste

**Contexto:** Peixos Puignau S.A. es una empresa de pescado (fresco, elaborado, congelado) con sede en Aiguaviva, Girona. Tiene ~112 empleados distribuidos en multiples departamentos. La gestoria externa prepara las nominas y entrega el IC en Excel cada dia 28 del mes.

## 4. Arquitectura de Datos

**Input:**
- Archivo Excel IC mensual de la gestoria (~112 empleados, ~40 conceptos salariales)
- Reglas de mapping contable (concepto + departamento -> subcuenta)
- Configuracion de departamentos/centros de coste

**Output:**
- Datos normalizados del IC (empleados, conceptos, importes)
- Asiento contable generado (lineas de debe/haber)
- Email de prenomina a destinatarios configurados
- Registro de trazabilidad completo

**Storage:**

```sql
-- Supabase (app web, config, logs)
ic_uploads        -- Archivos IC subidos (filename, periodo, status)
ic_employees      -- Empleados extraidos del IC (codigo, nombre, departamento)
ic_lines          -- Lineas del IC: concepto x empleado x importe
accounting_rules  -- Reglas de mapping: concepto -> subcuenta contable
accounting_entries     -- Asientos contables generados
accounting_entry_lines -- Lineas del asiento (cuenta, debe, haber)

-- SQL Server (datos contables del cliente - sincronizacion)
-- Estructura a definir segun esquema existente del cliente
```

## 5. Conceptos Salariales del IC

El IC contiene ~40 conceptos organizados en:

| Tipo | Ejemplos |
|------|----------|
| Devengos basicos | Salari Base, Millora Salarial, A Cte Conveni |
| Plus | Perillositat, Responsabilitat, Nocturnitat, Distancia, Productivitat |
| Pagas prorrateadas | PP Paga Estiu, PP Paga Nadal, PP Paga Beneficis |
| Variables | Comissions, Objectiu Variable |
| Incapacidad | Malaltia, Accident, Complement IT |
| Deducciones | Embargo Salarial, Descompte Prestec, Bestreta |

## 6. Stakeholders

| Persona | Rol | Empresa |
|---------|-----|---------|
| Loreto Basaure | Directora RRHH | Peixos Puignau |
| Enric Paredes | Director General (partner tecnico) | NowTech |
| Gabriel Rubio | CEO (desarrollador) | Bitalize |
| Jonathan Navarrete | COO/CTO (desarrollador) | Bitalize |

## 7. Stack Tecnico

| Capa | Tecnologia |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 3.4 |
| BD App | Supabase (PostgreSQL) |
| BD Cliente | SQL Server (via mssql) |
| Excel Parser | xlsx / exceljs |
| Email | Resend + React Email |
| Validacion | Zod |
