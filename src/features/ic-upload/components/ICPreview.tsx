'use client'

import Link from 'next/link'

interface UploadResult {
  id: number
  filename: string
  period: string
  company: string
  employeeCount: number
  conceptCount: number
  lineCount: number
  totalBrut: number
}

interface ICPreviewProps {
  result: UploadResult
  onReset: () => void
}

export function ICPreview({ result, onReset }: ICPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-green-200 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <h3 className="text-lg font-semibold text-slate-900">
              IC cargado correctamente
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">{result.filename}</p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          uploaded
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Empresa</p>
          <p className="font-semibold text-slate-900 mt-1">{result.company}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Periodo</p>
          <p className="font-semibold text-slate-900 mt-1">{result.period}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Empleados</p>
          <p className="font-semibold text-slate-900 mt-1">{result.employeeCount}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Brut</p>
          <p className="font-semibold text-slate-900 mt-1">
            {result.totalBrut.toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
            })}
          </p>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        {result.conceptCount} conceptos salariales · {result.lineCount} lineas procesadas
      </div>

      <div className="flex gap-3">
        <Link
          href={`/ic/${result.id}`}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Ver Detalle
        </Link>
        <button
          onClick={onReset}
          className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
        >
          Subir otro IC
        </button>
      </div>
    </div>
  )
}
