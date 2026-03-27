'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AccountingRuleWithRelations } from '../types'

export function RulesList() {
  const [rules, setRules] = useState<AccountingRuleWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [concepts, setConcepts] = useState<{ id: string; code: number; name: string }[]>([])

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    concept_id: '',
    account_code: '',
    debit_credit: 'D' as 'D' | 'H',
    description: '',
  })
  const [formError, setFormError] = useState('')

  const fetchRules = async () => {
    const sb = createClient()
    const { data } = await sb
      .from('accounting_rules')
      .select('*, salary_concepts!accounting_rules_concept_id_fkey(id, code, name, category)')
      .order('priority', { ascending: false })

    setRules((data as AccountingRuleWithRelations[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRules()
    const sb = createClient()
    sb.from('salary_concepts')
      .select('id, code, name')
      .eq('is_active', true)
      .order('code')
      .then(({ data }) => { if (data) setConcepts(data) })
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const sb = createClient()
    const { error } = await sb.from('accounting_rules').insert({
      concept_id: form.concept_id,
      account_code: form.account_code,
      debit_credit: form.debit_credit,
      description: form.description || null,
    })
    if (error) {
      setFormError(error.message)
      return
    }
    setForm({ concept_id: '', account_code: '', debit_credit: 'D', description: '' })
    setShowForm(false)
    fetchRules()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta regla?')) return
    const sb = createClient()
    await sb.from('accounting_rules').delete().eq('id', id)
    fetchRules()
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    const sb = createClient()
    await sb.from('accounting_rules').update({ is_active: !currentActive }).eq('id', id)
    fetchRules()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nueva Regla
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Concepto *</label>
              <select
                required
                value={form.concept_id}
                onChange={(e) => setForm({ ...form, concept_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">Seleccionar</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cuenta Contable *</label>
              <input
                type="text"
                required
                value={form.account_code}
                onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="640000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">D/H *</label>
              <select
                value={form.debit_credit}
                onChange={(e) => setForm({ ...form, debit_credit: e.target.value as 'D' | 'H' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="D">Debe (D)</option>
                <option value="H">Haber (H)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Opcional"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Guardar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No hay reglas contables definidas</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Concepto</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Cuenta</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">D/H</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Descripcion</th>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Estado</th>
                <th className="text-right px-6 py-3 text-slate-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((r) => {
                const concept = r.salary_concepts as unknown as { code: number; name: string } | null
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-slate-400 mr-1">{concept?.code}</span>
                      {concept?.name}
                    </td>
                    <td className="px-6 py-3 font-mono">{r.account_code}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.debit_credit === 'D' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {r.debit_credit === 'D' ? 'Debe' : 'Haber'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">{r.description || '—'}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleToggle(r.id, r.is_active)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          r.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.is_active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
