'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/features/variable-data/types'
import { ENTRY_STATUS_LABELS, ENTRY_STATUS_COLORS } from '@/features/accounting-rules/types'
import type { AccountingEntry } from '@/features/accounting-rules/types'
import type { GeneratedIC } from '@/features/ic-generator/types'

export function EntriesList() {
  const [entries, setEntries] = useState<AccountingEntry[]>([])
  const [ics, setICs] = useState<GeneratedIC[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedICId, setSelectedICId] = useState('')
  const [error, setError] = useState('')

  const fetchEntries = async () => {
    const sb = createClient()
    const { data } = await sb
      .from('accounting_entries')
      .select('*')
      .order('entry_date', { ascending: false })
    setEntries((data as AccountingEntry[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEntries()
    const sb = createClient()
    sb.from('generated_ics')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .then(({ data }) => setICs((data as GeneratedIC[]) || []))
  }, [])

  const generateEntry = async () => {
    if (!selectedICId) return
    setGenerating(true)
    setError('')

    try {
      const sb = createClient()

      // Get IC info
      const { data: ic } = await sb.from('generated_ics').select('*').eq('id', selectedICId).single()
      if (!ic) throw new Error('IC no encontrado')

      // Get IC lines with relations
      const { data: icLines } = await sb
        .from('generated_ic_lines')
        .select('*, salary_concepts!generated_ic_lines_concept_id_fkey(id, code, name), employees!generated_ic_lines_employee_id_fkey(id, department_id, cost_center_id)')
        .eq('generated_ic_id', selectedICId)

      // Get active accounting rules
      const { data: rules } = await sb
        .from('accounting_rules')
        .select('*')
        .eq('is_active', true)

      if (!rules || rules.length === 0) {
        setError('No hay reglas contables activas. Configura las reglas primero.')
        setGenerating(false)
        return
      }

      // Build entry lines by applying rules to IC lines
      type EntryLine = {
        account_code: string
        debit: number
        credit: number
        description: string
        department_id: string | null
        cost_center_id: string | null
        employee_id: string | null
        concept_id: string | null
      }

      const entryLines: EntryLine[] = []
      let totalDebit = 0
      let totalCredit = 0

      for (const icLine of (icLines || [])) {
        const concept = icLine.salary_concepts as unknown as { id: string; code: number; name: string } | null
        const emp = icLine.employees as unknown as { id: string; department_id: string | null; cost_center_id: string | null } | null
        if (!concept) continue

        // Find matching rule (by concept_id, higher priority first)
        const matchingRule = rules
          .filter((r) => r.concept_id === concept.id)
          .sort((a, b) => b.priority - a.priority)[0]

        if (!matchingRule) continue

        const line: EntryLine = {
          account_code: matchingRule.account_code,
          debit: matchingRule.debit_credit === 'D' ? icLine.amount : 0,
          credit: matchingRule.debit_credit === 'H' ? icLine.amount : 0,
          description: `${concept.code} - ${concept.name}`,
          department_id: emp?.department_id || null,
          cost_center_id: emp?.cost_center_id || null,
          employee_id: emp?.id || null,
          concept_id: concept.id,
        }

        entryLines.push(line)
        totalDebit += line.debit
        totalCredit += line.credit
      }

      if (entryLines.length === 0) {
        setError('No se generaron lineas. Verifica que las reglas cubren los conceptos del IC.')
        setGenerating(false)
        return
      }

      // Create entry
      const { data: entry, error: entryErr } = await sb
        .from('accounting_entries')
        .insert({
          generated_ic_id: selectedICId,
          entry_date: `${ic.period_year}-${String(ic.period_month).padStart(2, '0')}-28`,
          period_year: ic.period_year,
          period_month: ic.period_month,
          description: `Asiento nominas ${MONTH_NAMES[ic.period_month - 1]} ${ic.period_year}`,
          total_debit: Math.round(totalDebit * 100) / 100,
          total_credit: Math.round(totalCredit * 100) / 100,
          status: 'draft',
        })
        .select()
        .single()

      if (entryErr) throw entryErr

      // Insert lines
      const linesToInsert = entryLines.map((l) => ({ ...l, entry_id: entry.id }))
      const { error: linesErr } = await sb.from('accounting_entry_lines').insert(linesToInsert)
      if (linesErr) throw linesErr

      setSelectedICId('')
      fetchEntries()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando asiento')
    }
    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Generate from IC */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Generar Asiento desde IC</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">IC Generado</label>
            <select
              value={selectedICId}
              onChange={(e) => setSelectedICId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">Seleccionar IC</option>
              {ics.map((ic) => (
                <option key={ic.id} value={ic.id}>
                  {MONTH_NAMES[ic.period_month - 1]} {ic.period_year} — {ic.total_brut.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generateEntry}
            disabled={!selectedICId || generating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {generating ? 'Generando...' : 'Generar Asiento'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Entries list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay asientos generados</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Periodo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Fecha</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Descripcion</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Debe</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Haber</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/entries/${e.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      {MONTH_NAMES[e.period_month - 1]} {e.period_year}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{e.entry_date}</td>
                  <td className="px-6 py-3 text-slate-700">{e.description}</td>
                  <td className="px-6 py-3 text-right font-medium text-blue-700">
                    {e.total_debit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-orange-700">
                    {e.total_credit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ENTRY_STATUS_COLORS[e.status]}`}>
                      {ENTRY_STATUS_LABELS[e.status]}
                    </span>
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
