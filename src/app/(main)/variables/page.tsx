export default function VariablesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Datos Variables</h1>
        <p className="text-slate-500 mt-1">
          Captura mensual de horas extras, objetivos, bestretes e incidencias
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-800">Fase 3 — Proximamente</h3>
        <p className="text-sm text-amber-700 mt-2">
          La captura de datos variables mensuales se implementara tras completar
          el catalogo de conceptos salariales. Incluira:
        </p>
        <ul className="mt-3 text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>Formularios por tipo: horas extras, objetivos, bestretes</li>
          <li>Vista mensual por departamento</li>
          <li>Flujo de aprobacion: borrador → enviado → aprobado/rechazado</li>
          <li>Historial de capturas por periodo</li>
        </ul>
      </div>
    </div>
  )
}
