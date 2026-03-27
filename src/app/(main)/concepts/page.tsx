export default function ConceptsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conceptos Salariales</h1>
        <p className="text-slate-500 mt-1">
          Catalogo de conceptos salariales (devengos, pluses, deducciones)
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-800">Fase 2 — Proximamente</h3>
        <p className="text-sm text-amber-700 mt-2">
          El catalogo de conceptos salariales se implementara en la siguiente fase.
          Incluira:
        </p>
        <ul className="mt-3 text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>CRUD de ~40 conceptos salariales (codigo, nombre, tipo)</li>
          <li>Categorizacion: devengo, plus, prorrateo, variable, deduccion</li>
          <li>Marcaje fijo vs variable</li>
          <li>Asignacion de conceptos fijos a empleados con importes</li>
        </ul>
      </div>
    </div>
  )
}
