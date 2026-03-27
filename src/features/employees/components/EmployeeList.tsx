'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { EmployeeWithRelations, Department } from '../types'

interface EmployeeListProps {
  initialEmployees?: EmployeeWithRelations[]
}

export function EmployeeList({ initialEmployees }: EmployeeListProps) {
  const [employees, setEmployees] = useState<EmployeeWithRelations[]>(initialEmployees || [])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(!initialEmployees)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  useEffect(() => {
    const sb = createClient()
    sb.from('departments').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { if (data) setDepartments(data) })
  }, [])

  useEffect(() => {
    const sb = createClient()
    setLoading(true)

    const fetchEmployees = async () => {
      let query = sb
        .from('employees')
        .select('*, departments!employees_department_id_fkey(*), cost_centers(*)')
        .order('employee_code', { ascending: true })

      if (!showInactive) query = query.eq('is_active', true)
      if (departmentFilter) query = query.eq('department_id', departmentFilter)
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,employee_code.ilike.%${search}%`
        )
      }

      const { data, error } = await query
      if (error) {
        console.error('Error fetching employees:', error)
        setEmployees([])
      } else {
        setEmployees((data as EmployeeWithRelations[]) || [])
      }
      setLoading(false)
    }

    fetchEmployees()
  }, [search, departmentFilter, showInactive])

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o codigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los departamentos</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Mostrar inactivos
        </label>
      </div>

      {/* Contador */}
      <p className="text-sm text-slate-500">
        {employees.length} empleado{employees.length !== 1 ? 's' : ''}
      </p>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No se encontraron empleados</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Codigo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Apellidos</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Departamento</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Salario Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-blue-600 hover:text-blue-800 font-mono"
                    >
                      {emp.employee_code}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-900">{emp.last_name}</td>
                  <td className="px-6 py-3 text-slate-600">{emp.first_name}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {emp.departments?.name || '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {emp.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900">
                    {emp.base_salary
                      ? emp.base_salary.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
