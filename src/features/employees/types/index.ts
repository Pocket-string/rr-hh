import { z } from 'zod'

// --- Departamento ---
export const departmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  manager_employee_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export const departmentCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Codigo requerido'),
  manager_employee_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type Department = z.infer<typeof departmentSchema>
export type DepartmentCreate = z.infer<typeof departmentCreateSchema>

// --- Centro de Coste ---
export const costCenterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  department_id: z.string().uuid().nullable(),
  percentage: z.number(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export const costCenterCreateSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().min(1, 'Codigo requerido'),
  department_id: z.string().uuid().nullable().optional(),
  percentage: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
})

export type CostCenter = z.infer<typeof costCenterSchema>
export type CostCenterCreate = z.infer<typeof costCenterCreateSchema>

// --- Empleado ---
export const employeeSchema = z.object({
  id: z.string().uuid(),
  employee_code: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  nif: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  department_id: z.string().uuid().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  hire_date: z.string().nullable(),
  termination_date: z.string().nullable(),
  contract_type: z.string().nullable(),
  base_salary: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const employeeCreateSchema = z.object({
  employee_code: z.string().min(1, 'Codigo de empleado requerido'),
  first_name: z.string().min(1, 'Nombre requerido'),
  last_name: z.string().min(1, 'Apellidos requeridos'),
  nif: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  cost_center_id: z.string().uuid().nullable().optional(),
  hire_date: z.string().nullable().optional(),
  termination_date: z.string().nullable().optional(),
  contract_type: z.string().nullable().optional(),
  base_salary: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type Employee = z.infer<typeof employeeSchema>
export type EmployeeCreate = z.infer<typeof employeeCreateSchema>

// Employee con relaciones expandidas
export type EmployeeWithRelations = Employee & {
  departments?: Department | null
  cost_centers?: CostCenter | null
}
