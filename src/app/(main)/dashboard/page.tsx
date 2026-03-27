import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Automatizacion de Imputacion Contable
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/upload"
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-3">↑</div>
          <h3 className="font-semibold text-slate-900">Subir IC</h3>
          <p className="text-sm text-slate-500 mt-1">
            Cargar archivo Excel IC de la gestoria
          </p>
        </Link>

        <Link
          href="/ic"
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-3">≡</div>
          <h3 className="font-semibold text-slate-900">ICs Cargados</h3>
          <p className="text-sm text-slate-500 mt-1">
            Ver informes contables procesados
          </p>
        </Link>

        <Link
          href="/rules"
          className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-3">⚙</div>
          <h3 className="font-semibold text-slate-900">Reglas Contables</h3>
          <p className="text-sm text-slate-500 mt-1">
            Configurar mapping de conceptos a subcuentas
          </p>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Flujo de Trabajo</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</span>
            <span className="text-slate-600">Subir IC Excel</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</span>
            <span className="text-slate-600">Generar Asiento</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">3</span>
            <span className="text-slate-600">Enviar Prenomina</span>
          </div>
        </div>
      </div>
    </div>
  )
}
