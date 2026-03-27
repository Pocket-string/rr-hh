'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ICGeneratorPreview } from '@/features/ic-generator/components/ICGeneratorPreview'
import { MONTH_NAMES } from '@/features/variable-data/types'
import { IC_STATUS_LABELS, IC_STATUS_COLORS } from '@/features/ic-generator/types'
import type { GeneratedIC } from '@/features/ic-generator/types'

export default function ICGeneratePage() {
  const [history, setHistory] = useState<GeneratedIC[]>([])

  useEffect(() => {
    const sb = createClient()
    sb.from('generated_ics')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .then(({ data }) => {
        setHistory((data as GeneratedIC[]) || [])
      })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Generar IC</h1>
        <p className="text-slate-500 mt-1">
          Genera el Informe de Costes a partir de datos fijos y variables aprobados
        </p>
      </div>

      <ICGeneratorPreview />

      {/* Historial de ICs generados */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">ICs Generados</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-slate-500 font-medium">Periodo</th>
                  <th className="text-right px-6 py-3 text-slate-500 font-medium">Empleados</th>
                  <th className="text-right px-6 py-3 text-slate-500 font-medium">Total Brut</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                  <th className="text-left px-6 py-3 text-slate-500 font-medium">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((ic) => (
                  <tr key={ic.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link
                        href={`/ic/generated/${ic.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {MONTH_NAMES[ic.period_month - 1]} {ic.period_year}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{ic.employee_count}</td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">
                      {ic.total_brut.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${IC_STATUS_COLORS[ic.status]}`}>
                        {IC_STATUS_LABELS[ic.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {new Date(ic.created_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
