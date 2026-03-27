import { VariableDataForm } from '@/features/variable-data/components/VariableDataForm'

export default function NewVariablePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Dato Variable</h1>
        <p className="text-slate-500 mt-1">Registrar dato variable mensual para un empleado</p>
      </div>

      <VariableDataForm />
    </div>
  )
}
