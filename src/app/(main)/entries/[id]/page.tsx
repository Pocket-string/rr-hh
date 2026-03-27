'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/features/variable-data/types'
import { ENTRY_STATUS_LABELS, ENTRY_STATUS_COLORS } from '@/features/accounting-rules/types'
import type { AccountingEntry, AccountingEntryLine } from '@/features/accounting-rules/types'

export default function EntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<AccountingEntry | null>(null)
  const [lines, setLines] = useState<AccountingEntryLine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('accounting_entries')
      .select('*')
      .eq('id', params.id as string)
      .single()
      .then(({ data }) => {
        setEntry(data as AccountingEntry)
        if (data) {
          sb.from('accounting_entry_lines')
            .select('*')
            .eq('entry_id', data.id)
            .order('account_code')
            .then(({ data: linesData }) => {
              setLines((linesData as AccountingEntryLine[]) || [])
              setLoading(false)
            })
        } else {
          setLoading(false)
        }
      })
  }, [params.id])

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando...</div>

  if (!entry) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Asiento no encontrado</p>
        <Link href="/entries" className="text-blue-600 mt-2 inline-block">Volver</Link>
      </div>
    )
  }

  const handleConfirm = async () => {
    const sb = createClient()
    await sb.from('accounting_entries').update({ status: 'confirmed' }).eq('id', entry.id)
    window.location.reload()
  }

  const handleDelete = async () => {
    if (!confirm('Eliminar este asiento?')) return
    const sb = createClient()
    await sb.from('accounting_entries').delete().eq('id', entry.id)
    router.push('/entries')
  }

  // Group lines by account_code for summary
  const accountSummary = new Map<string, { debit: number; credit: number }>()
  for (const line of lines) {
    const existing = accountSummary.get(line.account_code) || { debit: 0, credit: 0 }
    existing.debit += line.debit
    existing.credit += line.credit
    accountSummary.set(line.account_code, existing)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Asiento {MONTH_NAMES[entry.period_month - 1]} {entry.period_year}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ENTRY_STATUS_COLORS[entry.status]}`}>
              {ENTRY_STATUS_LABELS[entry.status]}
            </span>
            <span className="text-slate-500 text-sm">Fecha: {entry.entry_date}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {entry.status === 'draft' && (
            <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              Confirmar
            </button>
          )}
          <button onClick={handleDelete} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
            Eliminar
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p className="text-sm text-blue-700">Total Debe</p>
          <p className="text-2xl font-bold text-blue-800">
            {entry.total_debit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <p className="text-sm text-orange-700">Total Haber</p>
          <p className="text-2xl font-bold text-orange-800">
            {entry.total_credit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      {/* Summary by account */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Resumen por Cuenta</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-2 text-slate-500 font-medium">Cuenta</th>
              <th className="text-right px-6 py-2 text-slate-500 font-medium">Debe</th>
              <th className="text-right px-6 py-2 text-slate-500 font-medium">Haber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[...accountSummary.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([account, totals]) => (
              <tr key={account}>
                <td className="px-6 py-2 font-mono">{account}</td>
                <td className="px-6 py-2 text-right font-medium text-blue-700">
                  {totals.debit > 0 ? totals.debit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : ''}
                </td>
                <td className="px-6 py-2 text-right font-medium text-orange-700">
                  {totals.credit > 0 ? totals.credit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail lines */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Detalle ({lines.length} lineas)</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-2 text-slate-500 font-medium">Cuenta</th>
              <th className="text-left px-6 py-2 text-slate-500 font-medium">Descripcion</th>
              <th className="text-right px-6 py-2 text-slate-500 font-medium">Debe</th>
              <th className="text-right px-6 py-2 text-slate-500 font-medium">Haber</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {lines.map((line) => (
              <tr key={line.id}>
                <td className="px-6 py-1.5 font-mono text-xs">{line.account_code}</td>
                <td className="px-6 py-1.5 text-slate-700">{line.description || '—'}</td>
                <td className="px-6 py-1.5 text-right font-medium text-blue-700">
                  {line.debit > 0 ? line.debit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : ''}
                </td>
                <td className="px-6 py-1.5 text-right font-medium text-orange-700">
                  {line.credit > 0 ? line.credit.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href="/entries" className="inline-block text-sm text-blue-600 hover:text-blue-800">
        ← Volver a asientos
      </Link>
    </div>
  )
}
