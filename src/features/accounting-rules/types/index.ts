import { z } from 'zod'

export const accountingRuleSchema = z.object({
  id: z.string().uuid(),
  concept_id: z.string().uuid(),
  account_code: z.string().min(1),
  debit_credit: z.enum(['D', 'H']),
  department_id: z.string().uuid().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  priority: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const accountingRuleCreateSchema = z.object({
  concept_id: z.string().uuid(),
  account_code: z.string().min(1, 'Cuenta requerida'),
  debit_credit: z.enum(['D', 'H'], { message: 'Debe/Haber requerido' }),
  department_id: z.string().uuid().nullable().optional(),
  cost_center_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  priority: z.number().int().optional(),
})

export type AccountingRule = z.infer<typeof accountingRuleSchema>
export type AccountingRuleCreate = z.infer<typeof accountingRuleCreateSchema>

export type AccountingRuleWithRelations = AccountingRule & {
  salary_concepts?: { id: string; code: number; name: string; category: string } | null
  departments?: { id: string; name: string } | null
  cost_centers?: { id: string; name: string } | null
}

// Asientos
export const accountingEntrySchema = z.object({
  id: z.string().uuid(),
  generated_ic_id: z.string().uuid().nullable(),
  entry_date: z.string(),
  period_year: z.number().int(),
  period_month: z.number().int(),
  description: z.string().nullable(),
  total_debit: z.number(),
  total_credit: z.number(),
  status: z.enum(['draft', 'confirmed', 'exported']),
  created_at: z.string(),
  updated_at: z.string(),
})

export type AccountingEntry = z.infer<typeof accountingEntrySchema>

export type AccountingEntryLine = {
  id: string
  entry_id: string
  account_code: string
  debit: number
  credit: number
  description: string | null
  department_id: string | null
  cost_center_id: string | null
  employee_id: string | null
  concept_id: string | null
}

export const ENTRY_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  exported: 'Exportado',
}

export const ENTRY_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-50 text-blue-700',
  exported: 'bg-green-50 text-green-700',
}
