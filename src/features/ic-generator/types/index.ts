import { z } from 'zod'

export const IC_STATUS = ['draft', 'confirmed', 'reconciled'] as const

export const IC_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  reconciled: 'Reconciliado',
}

export const IC_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-700',
  reconciled: 'bg-green-50 text-green-700',
}

export const generatedICSchema = z.object({
  id: z.string().uuid(),
  period_year: z.number().int(),
  period_month: z.number().int(),
  employee_count: z.number().int(),
  total_brut: z.number(),
  status: z.enum(IC_STATUS),
  generated_by: z.string().uuid().nullable(),
  approved_by: z.string().uuid().nullable(),
  reconciliation_diff: z.unknown().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type GeneratedIC = z.infer<typeof generatedICSchema>

export const generatedICLineSchema = z.object({
  id: z.string().uuid(),
  generated_ic_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  amount: z.number(),
  source: z.enum(['fixed', 'variable', 'computed']),
  created_at: z.string(),
})

export type GeneratedICLine = z.infer<typeof generatedICLineSchema>

export type GeneratedICLineWithRelations = GeneratedICLine & {
  employees?: {
    id: string
    employee_code: string
    first_name: string
    last_name: string
    departments?: { name: string } | null
  } | null
  salary_concepts?: { id: string; code: number; name: string; category: string } | null
}

// Agrupacion por empleado para preview
export type EmployeeICSummary = {
  employee_id: string
  employee_code: string
  first_name: string
  last_name: string
  department?: string
  lines: {
    concept_code: number
    concept_name: string
    category: string
    amount: number
    source: string
  }[]
  total_devengos: number
  total_deducciones: number
  total_empresa: number
  neto: number
}
