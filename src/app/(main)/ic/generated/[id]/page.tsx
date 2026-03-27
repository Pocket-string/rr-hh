'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ICDetail } from '@/features/ic-generator/components/ICDetail'
import type { GeneratedIC } from '@/features/ic-generator/types'

export default function GeneratedICDetailPage() {
  const params = useParams()
  const [ic, setIC] = useState<GeneratedIC | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.from('generated_ics')
      .select('*')
      .eq('id', params.id as string)
      .single()
      .then(({ data, error }) => {
        if (error) setIC(null)
        else setIC(data as GeneratedIC)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando...</div>
  }

  if (!ic) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">IC no encontrado</p>
        <Link href="/ic/generate" className="text-blue-600 mt-2 inline-block">
          Volver a generacion
        </Link>
      </div>
    )
  }

  return <ICDetail ic={ic} />
}
