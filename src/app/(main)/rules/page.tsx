export default function RulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reglas Contables</h1>
        <p className="text-slate-500 mt-1">
          Mapping de conceptos salariales a subcuentas contables
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-800">Pendiente de configuracion</h3>
        <p className="text-sm text-amber-700 mt-2">
          Las reglas de mapping contable se definiran en la reunion con el cliente.
          Una vez definidas, aqui podras:
        </p>
        <ul className="mt-3 text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>Crear reglas: concepto salarial → subcuenta contable</li>
          <li>Asignar reglas por departamento o centro de coste</li>
          <li>Configurar fallbacks cuando no hay asignacion especifica</li>
          <li>Activar/desactivar reglas</li>
        </ul>
      </div>
    </div>
  )
}
