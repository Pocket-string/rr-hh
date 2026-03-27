import { EntriesList } from '@/features/accounting-entry/components/EntriesList'

export default function EntriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Asientos Contables</h1>
        <p className="text-slate-500 mt-1">
          Asientos generados a partir de los ICs procesados
        </p>
      </div>

      <EntriesList />
    </div>
  )
}
