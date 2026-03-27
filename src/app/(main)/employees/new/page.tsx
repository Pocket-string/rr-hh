'use client'

import { EmployeeForm } from '@/features/employees/components/EmployeeForm'

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo Empleado</h1>
        <p className="text-slate-500 mt-1">Crear un nuevo empleado en el maestro</p>
      </div>

      <EmployeeForm />
    </div>
  )
}
