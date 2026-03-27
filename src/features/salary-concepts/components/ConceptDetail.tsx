'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SalaryConcept } from '../types'
import type { EmployeeFixedConceptWithRelations } from '../types'
import { CONCEPT_CATEGORY_LABELS } from '../types'

interface ConceptDetailProps {
  concept: SalaryConcept
}

export function ConceptDetail({ concept }: ConceptDetailProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<EmployeeFixedConceptWithRelations[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  // Form para asignar concepto fijo a empleado
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; employee_code: string; first_name: string; last_name: string }[]>([])
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    amount: '',
    effective_from: new Date().toISOString().split('T')[0],
  })
  const [assignError, setAssignError] = useState('')

  useEffect(() => {
    const sb = createClient()
    // Load assignments for this concept
    sb.from('employee_fixed_concepts')
      .select('*, employees!employee_fixed_concepts_employee_id_fkey(id, employee_code, first_name, last_name)')
      .eq('concept_id', concept.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAssignments((data as EmployeeFixedConceptWithRelations[]) || [])
        setLoadingAssignments(false)
      })
  }, [concept.id])

  const loadEmployees = async () => {
    const sb = createClient()
    const { data } = await sb
      .from('employees')
      .select('id, employee_code, first_name, last_name')
      .eq('is_active', true)
      .order('employee_code')
    if (data) setEmployees(data)
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssignError('')
    const sb = createClient()
    const { error } = await sb.from('employee_fixed_concepts').insert({
      employee_id: assignForm.employee_id,
      concept_id: concept.id,
      amount: Number(assignForm.amount),
      effective_from: assignForm.effective_from,
    })
    if (error) {
      setAssignError(error.message)
      return
    }
    // Reload assignments
    const { data } = await sb.from('employee_fixed_concepts')
      .select('*, employees!employee_fixed_concepts_employee_id_fkey(id, employee_code, first_name, last_name)')
      .eq('concept_id', concept.id)
      .order('created_at', { ascending: false })
    setAssignments((data as EmployeeFixedConceptWithRelations[]) || [])
    setShowAssignForm(false)
    setAssignForm({ employee_id: '', amount: '', effective_from: new Date().toISOString().split('T')[0] })
  }

  const handleRemoveAssignment = async (id: string) => {
    if (!confirm('Eliminar esta asignacion?')) return
    const sb = createClient()
    await sb.from('employee_fixed_concepts').delete().eq('id', id)
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleDelete = async () => {
    if (!confirm(`Eliminar concepto "${concept.name}"?`)) return
    const sb = createClient()
    const { error } = await sb.from('salary_concepts').delete().eq('id', concept.id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    router.push('/concepts')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{concept.name}</h1>
          <p className="text-slate-500 mt-1">Codigo: {concept.code}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/concepts/${concept.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Informacion del Concepto</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Codigo</dt>
            <dd className="font-mono text-slate-900">{concept.code}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Nombre</dt>
            <dd className="text-slate-900">{concept.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Categoria</dt>
            <dd className="text-slate-900">{CONCEPT_CATEGORY_LABELS[concept.category]}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tipo</dt>
            <dd>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                concept.is_fixed ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>
                {concept.is_fixed ? 'Fijo' : 'Variable'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Cuenta Contable</dt>
            <dd className="font-mono text-slate-900">{concept.default_account_code || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Estado</dt>
            <dd>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                concept.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {concept.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Asignaciones a empleados (solo si es concepto fijo) */}
      {concept.is_fixed && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Empleados Asignados ({assignments.length})
            </h2>
            <button
              onClick={() => {
                setShowAssignForm(!showAssignForm)
                if (!showAssignForm) loadEmployees()
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              + Asignar
            </button>
          </div>

          {showAssignForm && (
            <form onSubmit={handleAssign} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
              {assignError && (
                <p className="text-red-600 text-sm">{assignError}</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                <select
                  required
                  value={assignForm.employee_id}
                  onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} - {emp.last_name}, {emp.first_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Importe"
                  value={assignForm.amount}
                  onChange={(e) => setAssignForm({ ...assignForm, amount: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <input
                  type="date"
                  required
                  value={assignForm.effective_from}
                  onChange={(e) => setAssignForm({ ...assignForm, effective_from: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
                  Guardar
                </button>
                <button type="button" onClick={() => setShowAssignForm(false)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {loadingAssignments ? (
            <p className="text-slate-400 text-sm">Cargando...</p>
          ) : assignments.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay empleados asignados a este concepto</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Empleado</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-medium">Importe</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Desde</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Hasta</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-900">
                      <span className="font-mono text-xs text-slate-500 mr-2">
                        {a.employees?.employee_code}
                      </span>
                      {a.employees?.last_name}, {a.employees?.first_name}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                      {a.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{a.effective_from}</td>
                    <td className="px-4 py-2 text-slate-500">{a.effective_to || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemoveAssignment(a.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Link href="/concepts" className="inline-block text-sm text-blue-600 hover:text-blue-800">
        ← Volver al catalogo
      </Link>
    </div>
  )
}
