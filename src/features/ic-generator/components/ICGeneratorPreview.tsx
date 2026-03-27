'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/features/variable-data/types'
import type { EmployeeICSummary } from '../types'

const now = new Date()

export function ICGeneratorPreview() {
  const router = useRouter()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [preview, setPreview] = useState<EmployeeICSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const generatePreview = async () => {
    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const sb = createClient()

      // 1. Get active employees with relations
      const { data: employees } = await sb
        .from('employees')
        .select('id, employee_code, first_name, last_name, base_salary, departments!employees_department_id_fkey(name)')
        .eq('is_active', true)
        .order('employee_code')

      if (!employees || employees.length === 0) {
        setError('No hay empleados activos')
        setLoading(false)
        return
      }

      // 2. Get fixed concepts assigned to employees
      const { data: fixedConcepts } = await sb
        .from('employee_fixed_concepts')
        .select('employee_id, amount, salary_concepts!employee_fixed_concepts_concept_id_fkey(id, code, name, category)')
        .lte('effective_from', `${year}-${String(month).padStart(2, '0')}-28`)
        .or(`effective_to.is.null,effective_to.gte.${year}-${String(month).padStart(2, '0')}-01`)

      // 3. Get approved variable data for the period
      const { data: variableData } = await sb
        .from('monthly_variable_data')
        .select('employee_id, amount, salary_concepts!monthly_variable_data_concept_id_fkey(id, code, name, category)')
        .eq('period_year', year)
        .eq('period_month', month)
        .eq('status', 'approved')

      // 4. Get salary concept for base salary
      const { data: baseSalaryConcept } = await sb
        .from('salary_concepts')
        .select('id, code, name, category')
        .eq('code', 1)
        .single()

      // 5. Build preview per employee
      const summaries: EmployeeICSummary[] = []

      for (const emp of employees) {
        const lines: EmployeeICSummary['lines'] = []
        const dept = emp.departments as unknown as { name: string } | null

        // Add base salary as first line
        if (emp.base_salary && emp.base_salary > 0 && baseSalaryConcept) {
          lines.push({
            concept_code: baseSalaryConcept.code,
            concept_name: baseSalaryConcept.name,
            category: baseSalaryConcept.category,
            amount: emp.base_salary,
            source: 'fixed',
          })
        }

        // Add fixed concepts
        const empFixed = (fixedConcepts || []).filter((fc) => fc.employee_id === emp.id)
        for (const fc of empFixed) {
          const concept = fc.salary_concepts as unknown as { id: string; code: number; name: string; category: string } | null
          if (concept) {
            lines.push({
              concept_code: concept.code,
              concept_name: concept.name,
              category: concept.category,
              amount: fc.amount,
              source: 'fixed',
            })
          }
        }

        // Add variable data
        const empVar = (variableData || []).filter((vd) => vd.employee_id === emp.id)
        for (const vd of empVar) {
          const concept = vd.salary_concepts as unknown as { id: string; code: number; name: string; category: string } | null
          if (concept) {
            lines.push({
              concept_code: concept.code,
              concept_name: concept.name,
              category: concept.category,
              amount: vd.amount,
              source: 'variable',
            })
          }
        }

        // Sort lines by concept code
        lines.sort((a, b) => a.concept_code - b.concept_code)

        const total_devengos = lines
          .filter((l) => l.category.startsWith('devengos'))
          .reduce((sum, l) => sum + l.amount, 0)
        const total_deducciones = lines
          .filter((l) => l.category === 'deducciones')
          .reduce((sum, l) => sum + l.amount, 0)
        const total_empresa = lines
          .filter((l) => l.category === 'empresa')
          .reduce((sum, l) => sum + l.amount, 0)

        if (lines.length > 0) {
          summaries.push({
            employee_id: emp.id,
            employee_code: emp.employee_code,
            first_name: emp.first_name,
            last_name: emp.last_name,
            department: dept?.name || undefined,
            lines,
            total_devengos,
            total_deducciones,
            total_empresa,
            neto: total_devengos - total_deducciones,
          })
        }
      }

      setPreview(summaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando preview')
    }
    setLoading(false)
  }

  const confirmIC = async () => {
    if (!preview || preview.length === 0) return
    setSaving(true)
    setError('')

    try {
      const sb = createClient()
      const totalBrut = preview.reduce((sum, emp) => sum + emp.total_devengos, 0)

      // Create generated IC
      const { data: ic, error: icErr } = await sb
        .from('generated_ics')
        .insert({
          period_year: year,
          period_month: month,
          employee_count: preview.length,
          total_brut: totalBrut,
          status: 'draft',
        })
        .select()
        .single()

      if (icErr) {
        if (icErr.code === '23505') {
          setError(`Ya existe un IC generado para ${MONTH_NAMES[month - 1]} ${year}`)
        } else {
          setError(icErr.message)
        }
        setSaving(false)
        return
      }

      // Get concept IDs by code
      const conceptCodes = [...new Set(preview.flatMap((emp) => emp.lines.map((l) => l.concept_code)))]
      const { data: conceptsMap } = await sb
        .from('salary_concepts')
        .select('id, code')
        .in('code', conceptCodes)

      const codeToId = new Map((conceptsMap || []).map((c) => [c.code, c.id]))

      // Insert IC lines
      const lines = preview.flatMap((emp) =>
        emp.lines.map((line) => ({
          generated_ic_id: ic.id,
          employee_id: emp.employee_id,
          concept_id: codeToId.get(line.concept_code) || '',
          amount: line.amount,
          source: line.source,
        }))
      ).filter((l) => l.concept_id)

      if (lines.length > 0) {
        const { error: linesErr } = await sb.from('generated_ic_lines').insert(lines)
        if (linesErr) {
          setError('Error guardando lineas: ' + linesErr.message)
          setSaving(false)
          return
        }
      }

      router.push(`/ic/generated/${ic.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error confirmando IC')
    }
    setSaving(false)
  }

  const grandTotalDevengos = preview?.reduce((s, e) => s + e.total_devengos, 0) || 0
  const grandTotalDeducciones = preview?.reduce((s, e) => s + e.total_deducciones, 0) || 0
  const grandTotalEmpresa = preview?.reduce((s, e) => s + e.total_empresa, 0) || 0
  const grandTotalNeto = preview?.reduce((s, e) => s + e.neto, 0) || 0

  return (
    <div className="space-y-6">
      {/* Selector de periodo + boton generar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setPreview(null) }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setPreview(null) }}
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            min={2020} max={2030}
          />
        </div>
        <button
          onClick={generatePreview}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generando...' : 'Generar Preview'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Empleados</p>
              <p className="text-2xl font-bold text-slate-900">{preview.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Total Devengos</p>
              <p className="text-2xl font-bold text-green-700">
                {grandTotalDevengos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Total Deducciones</p>
              <p className="text-2xl font-bold text-red-700">
                {grandTotalDeducciones.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Neto a Pagar</p>
              <p className="text-2xl font-bold text-blue-700">
                {grandTotalNeto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>

          {grandTotalEmpresa > 0 && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Coste Empresa (SS empresa):{' '}
                <span className="font-bold text-slate-900">
                  {grandTotalEmpresa.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </p>
            </div>
          )}

          {/* Detalle por empleado */}
          <div className="space-y-4">
            {preview.map((emp) => (
              <div key={emp.employee_id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <span className="font-mono text-xs text-slate-400 mr-2">{emp.employee_code}</span>
                    <span className="font-medium text-slate-900">{emp.last_name}, {emp.first_name}</span>
                    {emp.department && (
                      <span className="text-slate-400 text-sm ml-2">({emp.department})</span>
                    )}
                  </div>
                  <span className="font-bold text-blue-700">
                    Neto: {emp.neto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400">
                      <th className="text-left px-6 py-2">Cod</th>
                      <th className="text-left px-6 py-2">Concepto</th>
                      <th className="text-left px-6 py-2">Origen</th>
                      <th className="text-right px-6 py-2">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {emp.lines.map((line, i) => (
                      <tr key={i} className={line.category === 'deducciones' ? 'text-red-700' : ''}>
                        <td className="px-6 py-1.5 font-mono text-xs">{line.concept_code}</td>
                        <td className="px-6 py-1.5">{line.concept_name}</td>
                        <td className="px-6 py-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            line.source === 'fixed' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                          }`}>
                            {line.source === 'fixed' ? 'Fijo' : 'Variable'}
                          </span>
                        </td>
                        <td className="px-6 py-1.5 text-right font-medium">
                          {line.category === 'deducciones' ? '-' : ''}
                          {line.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 text-xs">
                    <tr>
                      <td colSpan={3} className="px-6 py-1.5 text-right text-slate-500">Devengos:</td>
                      <td className="px-6 py-1.5 text-right font-medium text-green-700">
                        {emp.total_devengos.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-1.5 text-right text-slate-500">Deducciones:</td>
                      <td className="px-6 py-1.5 text-right font-medium text-red-700">
                        -{emp.total_deducciones.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>

          {/* Boton confirmar */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={confirmIC}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : `Confirmar IC ${MONTH_NAMES[month - 1]} ${year}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
