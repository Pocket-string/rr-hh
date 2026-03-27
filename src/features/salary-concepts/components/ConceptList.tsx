'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { SalaryConcept } from '../types'
import { CONCEPT_CATEGORY_LABELS } from '../types'

export function ConceptList() {
  const [concepts, setConcepts] = useState<SalaryConcept[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    const sb = createClient()
    setLoading(true)

    const fetchConcepts = async () => {
      let query = sb
        .from('salary_concepts')
        .select('*')
        .order('code', { ascending: true })

      if (!showInactive) query = query.eq('is_active', true)
      if (categoryFilter) query = query.eq('category', categoryFilter)

      const { data, error } = await query
      if (error) {
        console.error('Error fetching concepts:', error)
        setConcepts([])
      } else {
        setConcepts((data as SalaryConcept[]) || [])
      }
      setLoading(false)
    }

    fetchConcepts()
  }, [categoryFilter, showInactive])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar concepto "${name}"?`)) return
    const sb = createClient()
    const { error } = await sb.from('salary_concepts').delete().eq('id', id)
    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      setConcepts((prev) => prev.filter((c) => c.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorias</option>
          <option value="devengos_fijos">Devengos Fijos</option>
          <option value="devengos_variables">Devengos Variables</option>
          <option value="deducciones">Deducciones</option>
          <option value="empresa">Empresa</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Mostrar inactivos
        </label>
      </div>

      {/* Contador */}
      <p className="text-sm text-slate-500">
        {concepts.length} concepto{concepts.length !== 1 ? 's' : ''}
      </p>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : concepts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No se encontraron conceptos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Codigo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Nombre</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Categoria</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Tipo</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Cuenta</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {concepts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link
                      href={`/concepts/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 font-mono"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-900">{c.name}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {CONCEPT_CATEGORY_LABELS[c.category] || c.category}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.is_fixed
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {c.is_fixed ? 'Fijo' : 'Variable'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                    {c.default_account_code || '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {c.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
