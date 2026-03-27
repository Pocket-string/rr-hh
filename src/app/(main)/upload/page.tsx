'use client'

import { useState } from 'react'
import { ICDropzone } from '@/features/ic-upload/components/ICDropzone'
import { ICPreview } from '@/features/ic-upload/components/ICPreview'

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

export default function UploadPage() {
  const [result, setResult] = useState<UploadResult | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subir IC</h1>
        <p className="text-slate-500 mt-1">
          Carga el archivo Excel IC mensual de la gestoria
        </p>
      </div>

      {result ? (
        <ICPreview result={result} onReset={() => setResult(null)} />
      ) : (
        <ICDropzone onUploadComplete={setResult} />
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-amber-800">Formato esperado</h3>
        <ul className="mt-2 text-sm text-amber-700 space-y-1">
          <li>Archivo Excel (.xlsx) con el resumen de nominas de la gestoria</li>
          <li>Hoja 1: Datos individuales por empleado (columnas) y conceptos (filas)</li>
          <li>Hoja 2: Resumen de totales (para validacion cruzada)</li>
        </ul>
      </div>
    </div>
  )
}
