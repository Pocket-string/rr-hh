# PRP-003: Mejora de UX - Alineación con Flujo Operativo

> **Estado**: APROBADO
> **Fecha**: 2026-03-30
> **Proyecto**: RRHH Peixos Puignau
> **Origen**: Feedback de José Gabriel Rubio tras testing del MVP

---

## Objetivo

Reorganizar la experiencia de usuario (sidebar, dashboard y manual) para que refleje el flujo operativo real del ciclo mensual de nóminas, en lugar de la estructura técnica por módulos.

## Por Qué

| Problema | Solución |
|----------|----------|
| El sidebar no sigue el orden real de trabajo | Reordenar items para reflejar el flujo: Variables → Generar IC → Subir IC → Reconciliar → Asiento |
| El dashboard muestra tarjetas sueltas sin contexto de proceso | Rediseñar como guía de 5 pasos con estado en tiempo real |
| El manual está organizado por módulos técnicos | Reescribir como guía paso a paso del ciclo mensual |
| El usuario no-técnico necesita interpretar el sistema | Simplificar lenguaje y guiar visualmente |

**Valor de negocio**: Adopción más rápida por parte del equipo operativo. Reducción de errores por no seguir el orden correcto del proceso.

## Qué

### Criterios de Éxito
- [ ] El sidebar de "Nóminas" sigue el orden: Datos Variables → Generar IC → Subir IC → ICs Cargados → Reconciliación
- [ ] El dashboard muestra los 5 pasos del ciclo mensual con estado real (consultando Supabase)
- [ ] El dashboard permite seleccionar mes/año para ver el estado de cualquier periodo
- [ ] El manual está organizado como "Configuración inicial + Ciclo mensual paso a paso"
- [ ] El PDF del manual está regenerado con la nueva estructura
- [ ] `npm run typecheck` pasa sin errores
- [ ] Tests E2E con Playwright MCP validan sidebar, dashboard y flujo completo

### Comportamiento Esperado

**Flujo operativo mensual (Happy Path):**
1. Usuario abre el Dashboard → ve los 5 pasos del mes actual con su estado
2. Paso 1: Va a "Datos Variables" → registra horas extra, ausencias → aprueba los registros
3. Paso 2: Va a "Generar IC" → genera el informe interno con datos fijos + variables aprobados
4. Paso 3: Va a "Subir IC" → carga el Excel que envía la gestoría
5. Paso 4: Va a "Reconciliación" → compara IC interno vs gestoría → identifica diferencias
6. Paso 5: Va a "Asientos" → genera el asiento contable del mes
7. Vuelve al Dashboard → ve todos los pasos en verde (completados)

---

## Contexto

### Referencias
- `src/app/(main)/layout.tsx` — Sidebar con navegación (94 líneas)
- `src/app/(main)/dashboard/page.tsx` — Dashboard actual (69 líneas)
- `src/features/variable-data/components/MonthlyView.tsx` — Patrón de selector mes/año a reutilizar
- `src/features/variable-data/types/index.ts` — `MONTH_NAMES` constante a reutilizar
- `src/lib/supabase/client.ts` — Cliente Supabase para queries
- `docs/manual/MANUAL_USUARIO.md` — Manual actual (480 líneas)
- `docs/e2e-screenshots/` — 13 screenshots existentes para el manual

### Documento de Feedback
Archivo: `Mejora_Experiencia_RRHH_Peixos.docx` de José Gabriel Rubio

### Tablas Supabase consultadas por el Dashboard
- `monthly_variable_data` — Estado de datos variables (draft/submitted/approved)
- `generated_ics` — ICs generados internamente
- `accounting_entries` — Asientos contables
- API `/api/ic/list` — ICs subidos de la gestoría

---

## Blueprint (Assembly Line)

### Fase 1: Reordenar Sidebar
**Objetivo**: El menú lateral refleja el flujo operativo real
**Archivos**: `src/app/(main)/layout.tsx`
**Cambios**:
- Reordenar items de la sección "Nominas": mover Reconciliación de posición 3 a posición 5
- Corregir bug de `isActive` donde `/ic` marca activo también `/ic/generate` y `/ic/reconcile`
**Validación**: Sidebar muestra orden correcto, highlight funciona bien en cada ruta

### Fase 2: Rediseñar Dashboard
**Objetivo**: Dashboard como guía de ciclo mensual con estado en tiempo real
**Archivos**: `src/app/(main)/dashboard/page.tsx`
**Cambios**:
- Convertir a client component (`'use client'`)
- Agregar selector mes/año (reusar patrón de MonthlyView)
- 5 tarjetas de paso con número, nombre, descripción y estado real
- Queries paralelas a Supabase con `Promise.allSettled`
- Sección secundaria "Configuración" con links a Maestros + Reglas
**Validación**: Dashboard muestra 5 pasos, cambiar mes actualiza estados

### Fase 3: Reescribir Manual
**Objetivo**: Manual organizado como guía operativa paso a paso
**Archivos**: `docs/manual/MANUAL_USUARIO.md`
**Estructura nueva**:
1. Introducción (1 párrafo)
2. Configuración Inicial (Departamentos, Empleados, Conceptos, Reglas)
3. Ciclo Mensual Paso a Paso (5 pasos con "qué hacer" + "cómo hacerlo")
4. El Dashboard (cómo leer el panel)
5. FAQ
6. Soporte
**Validación**: Manual sigue el flujo operativo, lenguaje simple

### Fase 4: Regenerar PDF
**Objetivo**: PDF actualizado con nueva estructura del manual
**Archivos**: `docs/manual/MANUAL_USUARIO.pdf`
**Cambios**:
- Embeber imágenes como base64 en markdown temporal
- Generar PDF con `npx md-to-pdf`
**Validación**: PDF generado con imágenes visibles y estructura correcta

### Fase 5: Tests E2E con Playwright MCP
**Objetivo**: Validar todos los cambios de UX end-to-end usando Playwright MCP
**Herramientas**: Playwright MCP (browser_navigate, browser_snapshot, browser_click, browser_take_screenshot)
**Tests**:

**Test 1 — Sidebar orden correcto**:
- Navegar a `/dashboard`
- Verificar que la sección "Nominas" muestra items en orden: Datos Variables → Generar IC → Subir IC → ICs Cargados → Reconciliación
- Navegar a `/ic/generate` → verificar que solo "Generar IC" está activo (no "ICs Cargados")
- Navegar a `/ic` → verificar que solo "ICs Cargados" está activo
- Screenshot de sidebar

**Test 2 — Dashboard ciclo mensual**:
- Navegar a `/dashboard`
- Verificar título "Ciclo Mensual"
- Verificar que existen los 5 pasos: Datos Variables, Generar IC, Subir IC, Reconciliación, Generar Asiento
- Verificar selector de mes/año presente
- Cambiar mes → verificar que estados se actualizan
- Verificar sección "Configuración" con 4 tarjetas (Empleados, Departamentos, Conceptos, Reglas)
- Click en "Ir" del Paso 1 → verificar que navega a `/variables`
- Screenshot del dashboard completo

**Test 3 — Flujo operativo completo**:
- Seguir los 5 pasos del ciclo mensual en orden:
  1. `/variables` → verificar que carga
  2. `/ic/generate` → verificar que carga
  3. `/upload` → verificar que carga
  4. `/ic/reconcile` → verificar que carga
  5. `/entries` → verificar que carga
- Verificar que el sidebar highlight se actualiza correctamente en cada navegación
- Screenshots de cada paso

**Validación final**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Sidebar en orden correcto (verificado con Playwright)
- [ ] Dashboard muestra 5 pasos con estado (verificado con Playwright)
- [ ] Navegación entre pasos funciona (verificado con Playwright)
- [ ] Manual PDF con nueva estructura e imágenes embebidas
- [ ] Criterios de éxito cumplidos

---

## Gotchas

- [ ] El dashboard necesita ser `'use client'` para queries dinámicas a Supabase
- [ ] Los ICs subidos se consultan via `/api/ic/list` (fetch), no directamente en Supabase
- [ ] `pathname.startsWith('/ic')` marca múltiples items como activos — necesita fix
- [ ] Usar `Promise.allSettled` en dashboard para que un query fallido no bloquee los demás
- [ ] El PDF requiere proceso de 2 pasos: embeber imágenes base64 → md-to-pdf

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan
- NO ignorar errores de TypeScript
- NO hardcodear valores (usar constantes)
- NO agregar features nuevas — solo reorganizar la presentación existente

---

*PRP aprobado por el usuario. Listo para implementación.*
