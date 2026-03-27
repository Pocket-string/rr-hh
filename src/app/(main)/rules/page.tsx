import { RulesList } from '@/features/accounting-rules/components/RulesList'

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reglas Contables</h1>
        <p className="text-slate-500 mt-1">
          Mapping de conceptos salariales a subcuentas contables (Debe/Haber)
        </p>
      </div>

      <RulesList />
    </div>
  )
}
