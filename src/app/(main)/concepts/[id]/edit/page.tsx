'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ConceptForm } from '@/features/salary-concepts/components/ConceptForm'
import type { SalaryConcept } from '@/features/salary-concepts/types'

export default function EditConceptPage() {
  const params = useParams()
  const [concept, setConcept] = useState<SalaryConcept | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('salary_concepts')
      .select('*')
      .eq('id', params.id as string)
      .single()
      .then(({ data, error }) => {
        if (error) setConcept(null)
        else setConcept(data as SalaryConcept)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando...</div>
  }

  if (!concept) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Concepto no encontrado</p>
        <Link href="/concepts" className="text-blue-600 mt-2 inline-block">
          Volver al catalogo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Concepto</h1>
        <p className="text-slate-500 mt-1">
          {concept.name} (codigo: {concept.code})
        </p>
      </div>

      <ConceptForm concept={concept} />
    </div>
  )
}
