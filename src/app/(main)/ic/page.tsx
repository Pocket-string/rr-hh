'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ICUploadRecord {
  id: number
  filename: string
  periodStart: string
  periodEnd: string
  companyName: string
  employeeCount: number
  totalBrut: number
  status: string
  createdAt: string
}

const statusLabels: Record<string, { label: string; className: string }> = {
  uploaded: { label: 'Cargado', className: 'bg-blue-100 text-blue-700' },
  validated: { label: 'Validado', className: 'bg-yellow-100 text-yellow-700' },
  processed: { label: 'Procesado', className: 'bg-green-100 text-green-700' },
  sent: { label: 'Enviado', className: 'bg-purple-100 text-purple-700' },
}

export default function ICListPage() {
  const [uploads, setUploads] = useState<ICUploadRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ic/list')
      .then(res => res.json())
      .then(data => setUploads(data.uploads || []))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ICs Cargados</h1>
          <p className="text-slate-500 mt-1">
            Historial de informes contables procesados
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Subir nuevo IC
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Cargando...</div>
      ) : uploads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay ICs cargados aun</p>
          <Link
            href="/upload"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Subir el primer IC
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Archivo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Periodo</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Empleados</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Total Brut</th>
                <th className="text-center px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploads.map((u) => {
                const status = statusLabels[u.status] || statusLabels.uploaded
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {u.filename}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.periodStart} — {u.periodEnd}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {u.employeeCount}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {u.totalBrut.toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/ic/${u.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
