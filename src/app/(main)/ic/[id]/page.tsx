'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ICDetail {
  upload: {
    id: number
    filename: string
    periodStart: string
    periodEnd: string
    companyName: string
    companyNIF: string
    employeeCount: number
    totalBrut: number
    status: string
    createdAt: string
  }
  employees: {
    id: number
    employeeCode: string
    lastName: string
    firstName: string
    department: string | null
  }[]
  conceptSummary: {
    conceptCode: number
    conceptName: string
    employeeCount: number
    totalAmount: number
  }[]
}

export default function ICDetailPage() {
  const params = useParams()
  const [data, setData] = useState<ICDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'concepts' | 'employees'>('concepts')

  useEffect(() => {
    fetch(`/api/ic/${params.id}`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando...</div>
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">IC no encontrado</p>
        <Link href="/ic" className="text-blue-600 mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    )
  }

  const { upload, employees, conceptSummary } = data

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/ic" className="text-sm text-blue-600 hover:text-blue-800">
            ← Volver a ICs
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {upload.filename}
          </h1>
          <p className="text-slate-500 mt-1">
            {upload.companyName} — {upload.periodStart} a {upload.periodEnd}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Generar Asiento
          </button>
          <button className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
            Enviar Prenomina
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase">Empleados</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{upload.employeeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase">Conceptos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{conceptSummary.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase">Total Brut</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {upload.totalBrut.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase">NIF</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{upload.companyNIF}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('concepts')}
            className={`px-6 py-3 text-sm font-medium ${
              tab === 'concepts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Conceptos ({conceptSummary.length})
          </button>
          <button
            onClick={() => setTab('employees')}
            className={`px-6 py-3 text-sm font-medium ${
              tab === 'employees'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Empleados ({employees.length})
          </button>
        </div>

        {tab === 'concepts' && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Codigo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Concepto</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Empleados</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conceptSummary.map((c) => (
                <tr key={c.conceptCode} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-500 font-mono">{c.conceptCode}</td>
                  <td className="px-6 py-3 text-slate-900">{c.conceptName}</td>
                  <td className="px-6 py-3 text-right text-slate-600">{c.employeeCount}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900">
                    {c.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'employees' && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Codigo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Apellidos</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Departamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 text-slate-500 font-mono">{e.employeeCode}</td>
                  <td className="px-6 py-3 text-slate-900">{e.lastName}</td>
                  <td className="px-6 py-3 text-slate-600">{e.firstName}</td>
                  <td className="px-6 py-3 text-slate-500">{e.department || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
