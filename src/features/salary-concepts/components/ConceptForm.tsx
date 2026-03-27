'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SalaryConcept } from '../types'

interface ConceptFormProps {
  concept?: SalaryConcept
}

export function ConceptForm({ concept }: ConceptFormProps) {
  const router = useRouter()
  const isEdit = !!concept

  const [form, setForm] = useState({
    code: concept?.code ?? '',
    name: concept?.name ?? '',
    category: (concept?.category ?? 'devengos_fijos') as string,
    is_fixed: concept?.is_fixed ?? false,
    default_account_code: concept?.default_account_code ?? '',
    is_active: concept?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      code: Number(form.code),
      name: form.name,
      category: form.category,
      is_fixed: form.is_fixed,
      default_account_code: form.default_account_code || null,
      is_active: form.is_active,
    }

    const sb = createClient()

    if (isEdit) {
      const { error: err } = await sb
        .from('salary_concepts')
        .update(payload)
        .eq('id', concept.id)
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    } else {
      const { error: err } = await sb
        .from('salary_concepts')
        .insert(payload)
      if (err) {
        setError(err.message)
        setSaving(false)
        return
      }
    }

    router.push('/concepts')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Codigo *</label>
          <input
            type="number"
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Salario Base"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="devengos_fijos">Devengos Fijos</option>
            <option value="devengos_variables">Devengos Variables</option>
            <option value="deducciones">Deducciones</option>
            <option value="empresa">Empresa</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta Contable</label>
          <input
            type="text"
            value={form.default_account_code}
            onChange={(e) => setForm({ ...form, default_account_code: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="640000"
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_fixed}
            onChange={(e) => setForm({ ...form, is_fixed: e.target.checked })}
            className="rounded"
          />
          Concepto fijo (contractual)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="rounded"
          />
          Activo
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Concepto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/concepts')}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
