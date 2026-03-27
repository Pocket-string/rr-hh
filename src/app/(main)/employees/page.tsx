'use client'

import Link from 'next/link'
import { EmployeeList } from '@/features/employees/components/EmployeeList'

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>
          <p className="text-slate-500 mt-1">
            Maestro de empleados de Peixos Puignau
          </p>
        </div>
        <Link
          href="/employees/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nuevo Empleado
        </Link>
      </div>

      <EmployeeList />
    </div>
  )
}
