'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EmployeeWithRelations, Department, CostCenter } from '../types'

interface EmployeeFormProps {
  employee?: EmployeeWithRelations | null
  onSuccess?: () => void
}

export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const router = useRouter()
  const isEditing = !!employee

  const [departments, setDepartments] = useState<Department[]>([])
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    employee_code: employee?.employee_code || '',
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    nif: employee?.nif || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    department_id: employee?.department_id || '',
    cost_center_id: employee?.cost_center_id || '',
    hire_date: employee?.hire_date || '',
    termination_date: employee?.termination_date || '',
    contract_type: employee?.contract_type || '',
    base_salary: employee?.base_salary?.toString() || '',
    is_active: employee?.is_active ?? true,
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('departments').select('*').eq('is_active', true).order('name'),
      supabase.from('cost_centers').select('*').eq('is_active', true).order('name'),
    ]).then(([deptRes, ccRes]) => {
      if (deptRes.data) setDepartments(deptRes.data)
      if (ccRes.data) setCostCenters(ccRes.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      ...form,
      nif: form.nif || null,
      email: form.email || null,
      phone: form.phone || null,
      department_id: form.department_id || null,
      cost_center_id: form.cost_center_id || null,
      hire_date: form.hire_date || null,
      termination_date: form.termination_date || null,
      contract_type: form.contract_type || null,
      base_salary: form.base_salary ? parseFloat(form.base_salary) : null,
    }

    try {
      if (isEditing) {
        const { error } = await supabase.from('employees').update(payload).eq('id', employee.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('employees').insert(payload)
        if (error) throw new Error(error.message)
      }

      onSuccess?.()
      router.push('/employees')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar empleado')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Datos basicos */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Datos Basicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Codigo Empleado *</label>
            <input
              type="text"
              value={form.employee_code}
              onChange={(e) => updateField('employee_code', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="000001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">NIF</label>
            <input
              type="text"
              value={form.nif}
              onChange={(e) => updateField('nif', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefono</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Organizacion */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Organizacion</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
            <select
              value={form.department_id}
              onChange={(e) => updateField('department_id', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin asignar</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Coste</label>
            <select
              value={form.cost_center_id}
              onChange={(e) => updateField('cost_center_id', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin asignar</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>{cc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contrato */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-semibold text-slate-900">Contrato</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Contrato</label>
            <select
              value={form.contract_type}
              onChange={(e) => updateField('contract_type', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar</option>
              <option value="indefinido">Indefinido</option>
              <option value="temporal">Temporal</option>
              <option value="practicas">Practicas</option>
              <option value="formacion">Formacion</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Alta</label>
            <input
              type="date"
              value={form.hire_date}
              onChange={(e) => updateField('hire_date', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Salario Base (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={form.base_salary}
              onChange={(e) => updateField('base_salary', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => updateField('is_active', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="is_active" className="text-sm text-slate-700">Empleado activo</label>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Empleado'}
        </button>
      </div>
    </form>
  )
}
