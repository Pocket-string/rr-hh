---
name: automatizacion-ic
description: Proyecto principal - automatizacion de imputacion contable de nominas para Peixos Puignau S.A.
type: project
---

## Estado del proyecto (2026-03-26)

- PRP-001 creado y aprobado
- Codigo LexAgenda eliminado, proyecto limpio
- Reunion con cliente programada para lunes 2026-03-31 a las 15:00 (hora Espana) / 11:00 (hora Chile)

## Decisiones tomadas
- BD dual: Supabase (app web) + SQL Server (datos contables del cliente)
- Enfoque simple y estructural, por fases (no app compleja desde dia 1)
- Las reglas de mapping contable se definiran en reunion con el cliente

## Fases
1. Ingesta y Normalizacion del IC (Excel parser + DB + viewer)
2. Motor de Reglas Contables (CRUD reglas + engine de mapping)
3. Generacion de Asiento Contable (builder + sync SQL Server)
4. Envio de Prenomina y Trazabilidad (email + dashboard)
5. Validacion Final (testing e2e)

## Datos clave del IC
- ~112 empleados, ~40 conceptos salariales
- Total bruto Feb 2026: 251,648.05 EUR
- Empresa: Peixos Puignau S.A. (NIF: A17216359)
- Codigos de empleado: TEXT (empiezan con 0, ej: "000002")
- Idioma del Excel: Catalan
