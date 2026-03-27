'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EmployeeDetail } from '@/features/employees/components/EmployeeDetail'
import type { EmployeeWithRelations } from '@/features/employees/types'

export default function EmployeeDetailPage() {
  const params = useParams()
  const [employee, setEmployee] = useState<EmployeeWithRelations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('employees')
      .select('*, departments!employees_department_id_fkey(*), cost_centers(*)')
      .eq('id', params.id as string)
      .single()
      .then(({ data, error }) => {
        if (error) setEmployee(null)
        else setEmployee(data as EmployeeWithRelations)
        setLoading(false)
      })
  }, [params.id])

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Cargando...</div>
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Empleado no encontrado</p>
        <Link href="/employees" className="text-blue-600 mt-2 inline-block">
          Volver a la lista
        </Link>
      </div>
    )
  }

  return <EmployeeDetail employee={employee} />
}
