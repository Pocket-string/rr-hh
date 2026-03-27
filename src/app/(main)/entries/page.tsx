export default function EntriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Asientos Contables</h1>
        <p className="text-slate-500 mt-1">
          Asientos generados a partir de los ICs procesados
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">
          Los asientos se generaran automaticamente cuando las reglas contables esten configuradas
          y se procese un IC.
        </p>
      </div>
    </div>
  )
}
