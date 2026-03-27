import { ConceptForm } from '@/features/salary-concepts/components/ConceptForm'

export default function NewConceptPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Concepto Salarial</h1>
        <p className="text-slate-500 mt-1">Agregar concepto al catalogo</p>
      </div>

      <ConceptForm />
    </div>
  )
}
