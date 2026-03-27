import Link from 'next/link'
import { MonthlyView } from '@/features/variable-data/components/MonthlyView'

export default function VariablesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Datos Variables</h1>
          <p className="text-slate-500 mt-1">
            Captura mensual de horas extras, objetivos, bestretes e incidencias
          </p>
        </div>
        <Link
          href="/variables/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nuevo Registro
        </Link>
      </div>

      <MonthlyView />
    </div>
  )
}
