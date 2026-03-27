import { z } from 'zod'

export const VARIABLE_STATUS = ['draft', 'submitted', 'approved', 'rejected'] as const

export const VARIABLE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export const VARIABLE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
}

export const monthlyVariableSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  period_year: z.number().int(),
  period_month: z.number().int().min(1).max(12),
  amount: z.number(),
  quantity: z.number().nullable(),
  notes: z.string().nullable(),
  status: z.enum(VARIABLE_STATUS),
  submitted_by: z.string().uuid().nullable(),
  approved_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const monthlyVariableCreateSchema = z.object({
  employee_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  period_year: z.number().int().min(2020).max(2030),
  period_month: z.number().int().min(1).max(12),
  amount: z.number().min(0, 'Importe debe ser positivo'),
  quantity: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(VARIABLE_STATUS).optional(),
})

export type MonthlyVariable = z.infer<typeof monthlyVariableSchema>
export type MonthlyVariableCreate = z.infer<typeof monthlyVariableCreateSchema>

export type MonthlyVariableWithRelations = MonthlyVariable & {
  employees?: {
    id: string
    employee_code: string
    first_name: string
    last_name: string
    departments?: { name: string } | null
  } | null
  salary_concepts?: { id: string; code: number; name: string; category: string } | null
}

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
