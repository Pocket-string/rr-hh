'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '../types'

const now = new Date()

export function VariableDataForm() {
  const router = useRouter()
  const [employees, setEmployees] = useState<{ id: string; employee_code: string; first_name: string; last_name: string }[]>([])
  const [concepts, setConcepts] = useState<{ id: string; code: number; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    employee_id: '',
    concept_id: '',
    period_year: now.getFullYear(),
    period_month: now.getMonth() + 1,
    amount: '',
    quantity: '',
    notes: '',
  })

  useEffect(() => {
    const sb = createClient()
    sb.from('employees')
      .select('id, employee_code, first_name, last_name')
      .eq('is_active', true)
      .order('employee_code')
      .then(({ data }) => { if (data) setEmployees(data) })

    sb.from('salary_concepts')
      .select('id, code, name')
      .eq('is_active', true)
      .eq('is_fixed', false)
      .order('code')
      .then(({ data }) => { if (data) setConcepts(data) })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const sb = createClient()
    const { error: err } = await sb.from('monthly_variable_data').insert({
      employee_id: form.employee_id,
      concept_id: form.concept_id,
      period_year: form.period_year,
      period_month: form.period_month,
      amount: Number(form.amount),
      quantity: form.quantity ? Number(form.quantity) : null,
      notes: form.notes || null,
      status: 'draft',
    })

    if (err) {
      if (err.code === '23505') {
        setError('Ya existe un registro para este empleado, concepto y periodo')
      } else {
        setError(err.message)
      }
      setSaving(false)
      return
    }

    router.push('/variables')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Periodo Mes *</label>
          <select
            value={form.period_month}
            onChange={(e) => setForm({ ...form, period_month: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ano *</label>
          <input
            type="number"
            value={form.period_year}
            onChange={(e) => setForm({ ...form, period_year: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={2020}
            max={2030}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Empleado *</label>
        <select
          required
          value={form.employee_id}
          onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar empleado</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.employee_code} - {emp.last_name}, {emp.first_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Concepto Variable *</label>
        <select
          required
          value={form.concept_id}
          onChange={(e) => setForm({ ...form, concept_id: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar concepto</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Importe (EUR) *</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad (horas, dias...)</label>
          <input
            type="number"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Opcional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Observaciones opcionales"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Crear Registro'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/variables')}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
