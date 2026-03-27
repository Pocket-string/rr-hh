'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { EmployeeWithRelations } from '../types'

interface EmployeeDetailProps {
  employee: EmployeeWithRelations
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Estas seguro de eliminar este empleado?')) return

    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('employees').delete().eq('id', employee.id)
      if (error) throw new Error(error.message)
      router.push('/employees')
      router.refresh()
    } catch {
      alert('Error al eliminar empleado')
      setDeleting(false)
    }
  }

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 font-medium">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/employees" className="text-sm text-blue-600 hover:text-blue-800">
            ← Volver a Empleados
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">
            {employee.last_name}, {employee.first_name}
          </h1>
          <p className="text-slate-500 mt-1">Codigo: {employee.employee_code}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/employees/${employee.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos personales */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Datos Personales</h3>
          <InfoRow label="Nombre completo" value={`${employee.first_name} ${employee.last_name}`} />
          <InfoRow label="NIF" value={employee.nif} />
          <InfoRow label="Email" value={employee.email} />
          <InfoRow label="Telefono" value={employee.phone} />
          <InfoRow
            label="Estado"
            value={employee.is_active ? 'Activo' : 'Inactivo'}
          />
        </div>

        {/* Organizacion */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Organizacion</h3>
          <InfoRow label="Departamento" value={employee.departments?.name} />
          <InfoRow label="Centro de Coste" value={employee.cost_centers?.name} />
          <InfoRow label="Tipo de Contrato" value={employee.contract_type} />
          <InfoRow label="Fecha de Alta" value={employee.hire_date} />
          <InfoRow label="Fecha de Baja" value={employee.termination_date} />
          <InfoRow
            label="Salario Base"
            value={employee.base_salary
              ? employee.base_salary.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
              : null}
          />
        </div>
      </div>
    </div>
  )
}
