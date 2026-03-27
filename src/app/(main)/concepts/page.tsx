import Link from 'next/link'
import { ConceptList } from '@/features/salary-concepts/components/ConceptList'

export default function ConceptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conceptos Salariales</h1>
          <p className="text-slate-500 mt-1">
            Catalogo de conceptos (devengos, pluses, deducciones)
          </p>
        </div>
        <Link
          href="/concepts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nuevo Concepto
        </Link>
      </div>

      <ConceptList />
    </div>
  )
}
