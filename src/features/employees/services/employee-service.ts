import { createClient } from '@/lib/supabase/client'
import type { Employee, EmployeeCreate, EmployeeWithRelations, Department, DepartmentCreate, CostCenter, CostCenterCreate } from '../types'

const supabase = createClient()

// --- Empleados ---

export async function getEmployees(filters?: {
  search?: string
  department_id?: string
  is_active?: boolean
}): Promise<EmployeeWithRelations[]> {
  let query = supabase
    .from('employees')
    .select('*, departments(*), cost_centers(*)')
    .order('employee_code', { ascending: true })

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }
  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }
  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as EmployeeWithRelations[]
}

export async function getEmployeeById(id: string): Promise<EmployeeWithRelations | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*, departments(*), cost_centers(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as EmployeeWithRelations
}

export async function createEmployee(employee: EmployeeCreate): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEmployee(id: string, updates: Partial<EmployeeCreate>): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// --- Departamentos ---

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function createDepartment(dept: DepartmentCreate): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert(dept)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDepartment(id: string, updates: Partial<DepartmentCreate>): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// --- Centros de Coste ---

export async function getCostCenters(): Promise<CostCenter[]> {
  const { data, error } = await supabase
    .from('cost_centers')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function createCostCenter(cc: CostCenterCreate): Promise<CostCenter> {
  const { data, error } = await supabase
    .from('cost_centers')
    .insert(cc)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCostCenter(id: string, updates: Partial<CostCenterCreate>): Promise<CostCenter> {
  const { data, error } = await supabase
    .from('cost_centers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
