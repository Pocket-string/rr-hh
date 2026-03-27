'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MonthlyVariableWithRelations } from '../types'
import {
  VARIABLE_STATUS_LABELS,
  VARIABLE_STATUS_COLORS,
  MONTH_NAMES,
} from '../types'

const now = new Date()

export function MonthlyView() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<MonthlyVariableWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const sb = createClient()
    let query = sb
      .from('monthly_variable_data')
      .select(`
        *,
        employees!monthly_variable_data_employee_id_fkey(
          id, employee_code, first_name, last_name,
          departments!employees_department_id_fkey(name)
        ),
        salary_concepts!monthly_variable_data_concept_id_fkey(id, code, name, category)
      `)
      .eq('period_year', year)
      .eq('period_month', month)
      .order('created_at', { ascending: false })

    if (statusFilter) query = query.eq('status', statusFilter)

    const { data: rows, error } = await query
    if (error) {
      console.error('Error fetching variable data:', error)
      setData([])
    } else {
      setData((rows as MonthlyVariableWithRelations[]) || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [year, month, statusFilter])

  const handleStatusChange = async (id: string, newStatus: string) => {
    const sb = createClient()
    const { error } = await sb
      .from('monthly_variable_data')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este registro?')) return
    const sb = createClient()
    await sb.from('monthly_variable_data').delete().eq('id', id)
    fetchData()
  }

  const totalAmount = data.reduce((sum, d) => sum + (d.amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* Controles de periodo */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={2020}
          max={2030}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="submitted">Enviado</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Rechazado</option>
        </select>
        <div className="ml-auto text-sm text-slate-500">
          {data.length} registro{data.length !== 1 ? 's' : ''} — Total:{' '}
          <span className="font-medium text-slate-900">
            {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No hay datos variables para {MONTH_NAMES[month - 1]} {year}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Empleado</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Concepto</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Cantidad</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Importe</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Notas</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs text-slate-400 mr-1">
                      {d.employees?.employee_code}
                    </span>
                    <span className="text-slate-900">
                      {d.employees?.last_name}, {d.employees?.first_name}
                    </span>
                    {d.employees?.departments?.name && (
                      <span className="text-slate-400 text-xs ml-1">
                        ({d.employees.departments.name})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    <span className="font-mono text-xs text-slate-400 mr-1">
                      {d.salary_concepts?.code}
                    </span>
                    {d.salary_concepts?.name}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-600">
                    {d.quantity ?? '—'}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900">
                    {d.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      VARIABLE_STATUS_COLORS[d.status] || ''
                    }`}>
                      {VARIABLE_STATUS_LABELS[d.status] || d.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                    {d.notes || '—'}
                  </td>
                  <td className="px-6 py-3 text-right space-x-2">
                    {d.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(d.id, 'submitted')}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Enviar
                      </button>
                    )}
                    {d.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(d.id, 'approved')}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleStatusChange(d.id, 'rejected')}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {(d.status === 'draft' || d.status === 'rejected') && (
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Eliminar
                      </button>
                    )}
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
