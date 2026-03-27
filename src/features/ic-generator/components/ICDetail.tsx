'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/features/variable-data/types'
import type { GeneratedIC, GeneratedICLineWithRelations } from '../types'
import { IC_STATUS_LABELS, IC_STATUS_COLORS } from '../types'

interface ICDetailProps {
  ic: GeneratedIC
}

type GroupedLines = {
  employee_code: string
  first_name: string
  last_name: string
  department?: string
  lines: GeneratedICLineWithRelations[]
  total_devengos: number
  total_deducciones: number
  neto: number
}

export function ICDetail({ ic }: ICDetailProps) {
  const router = useRouter()
  const [lines, setLines] = useState<GeneratedICLineWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('generated_ic_lines')
      .select(`
        *,
        employees!generated_ic_lines_employee_id_fkey(
          id, employee_code, first_name, last_name,
          departments!employees_department_id_fkey(name)
        ),
        salary_concepts!generated_ic_lines_concept_id_fkey(id, code, name, category)
      `)
      .eq('generated_ic_id', ic.id)
      .then(({ data }) => {
        setLines((data as GeneratedICLineWithRelations[]) || [])
        setLoading(false)
      })
  }, [ic.id])

  const handleConfirm = async () => {
    const sb = createClient()
    await sb.from('generated_ics').update({ status: 'confirmed' }).eq('id', ic.id)
    router.refresh()
    window.location.reload()
  }

  const handleDelete = async () => {
    if (!confirm('Eliminar este IC generado y todas sus lineas?')) return
    const sb = createClient()
    await sb.from('generated_ics').delete().eq('id', ic.id)
    router.push('/ic/generate')
  }

  // Group lines by employee
  const grouped: GroupedLines[] = []
  const employeeMap = new Map<string, GroupedLines>()

  for (const line of lines) {
    const empId = line.employee_id
    if (!employeeMap.has(empId)) {
      const dept = line.employees?.departments as { name: string } | null
      employeeMap.set(empId, {
        employee_code: line.employees?.employee_code || '',
        first_name: line.employees?.first_name || '',
        last_name: line.employees?.last_name || '',
        department: dept?.name,
        lines: [],
        total_devengos: 0,
        total_deducciones: 0,
        neto: 0,
      })
    }
    const group = employeeMap.get(empId)!
    group.lines.push(line)
    const cat = line.salary_concepts?.category || ''
    if (cat.startsWith('devengos')) group.total_devengos += line.amount
    else if (cat === 'deducciones') group.total_deducciones += line.amount
  }

  for (const [, group] of employeeMap) {
    group.neto = group.total_devengos - group.total_deducciones
    group.lines.sort((a, b) => (a.salary_concepts?.code || 0) - (b.salary_concepts?.code || 0))
    grouped.push(group)
  }
  grouped.sort((a, b) => a.employee_code.localeCompare(b.employee_code))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            IC {MONTH_NAMES[ic.period_month - 1]} {ic.period_year}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${IC_STATUS_COLORS[ic.status]}`}>
              {IC_STATUS_LABELS[ic.status]}
            </span>
            <span className="text-slate-500 text-sm">
              {ic.employee_count} empleados — Total brut:{' '}
              <span className="font-medium text-slate-900">
                {ic.total_brut.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {ic.status === 'draft' && (
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Lines */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando lineas...</div>
      ) : (
        <div className="space-y-4">
          {grouped.map((emp) => (
            <div key={emp.employee_code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono text-xs text-slate-400 mr-2">{emp.employee_code}</span>
                  <span className="font-medium text-slate-900">{emp.last_name}, {emp.first_name}</span>
                  {emp.department && <span className="text-slate-400 text-sm ml-2">({emp.department})</span>}
                </div>
                <span className="font-bold text-blue-700">
                  Neto: {emp.neto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {emp.lines.map((line) => (
                    <tr key={line.id} className={line.salary_concepts?.category === 'deducciones' ? 'text-red-700' : ''}>
                      <td className="px-6 py-1.5 font-mono text-xs w-16">{line.salary_concepts?.code}</td>
                      <td className="px-6 py-1.5">{line.salary_concepts?.name}</td>
                      <td className="px-6 py-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          line.source === 'fixed' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {line.source === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                      </td>
                      <td className="px-6 py-1.5 text-right font-medium w-32">
                        {line.salary_concepts?.category === 'deducciones' ? '-' : ''}
                        {line.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <Link href="/ic/generate" className="inline-block text-sm text-blue-600 hover:text-blue-800">
        ← Volver a generacion
      </Link>
    </div>
  )
}
