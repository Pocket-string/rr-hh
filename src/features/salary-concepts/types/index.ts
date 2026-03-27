import { z } from 'zod'

// --- Concepto Salarial ---
export const CONCEPT_CATEGORIES = [
  'devengos_fijos',
  'devengos_variables',
  'deducciones',
  'empresa',
] as const

export const CONCEPT_CATEGORY_LABELS: Record<string, string> = {
  devengos_fijos: 'Devengos Fijos',
  devengos_variables: 'Devengos Variables',
  deducciones: 'Deducciones',
  empresa: 'Empresa',
}

export const salaryConceptSchema = z.object({
  id: z.string().uuid(),
  code: z.number().int(),
  name: z.string().min(1),
  category: z.enum(CONCEPT_CATEGORIES),
  is_fixed: z.boolean(),
  default_account_code: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const salaryConceptCreateSchema = z.object({
  code: z.number().int().min(1, 'Codigo requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  category: z.enum(CONCEPT_CATEGORIES, { message: 'Categoria requerida' }),
  is_fixed: z.boolean().optional(),
  default_account_code: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type SalaryConcept = z.infer<typeof salaryConceptSchema>
export type SalaryConceptCreate = z.infer<typeof salaryConceptCreateSchema>

// --- Concepto Fijo Asignado a Empleado ---
export const employeeFixedConceptSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  amount: z.number(),
  effective_from: z.string(),
  effective_to: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const employeeFixedConceptCreateSchema = z.object({
  employee_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  amount: z.number().min(0, 'Importe debe ser positivo'),
  effective_from: z.string().min(1, 'Fecha inicio requerida'),
  effective_to: z.string().nullable().optional(),
})

export type EmployeeFixedConcept = z.infer<typeof employeeFixedConceptSchema>
export type EmployeeFixedConceptCreate = z.infer<typeof employeeFixedConceptCreateSchema>

// Con relaciones expandidas
export type EmployeeFixedConceptWithRelations = EmployeeFixedConcept & {
  salary_concepts?: SalaryConcept | null
  employees?: { id: string; employee_code: string; first_name: string; last_name: string } | null
}
