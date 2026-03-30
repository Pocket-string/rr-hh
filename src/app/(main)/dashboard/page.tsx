'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/features/variable-data/types'

const now = new Date()

interface StepStatus {
  label: string
  detail: string
  state: 'completed' | 'in_progress' | 'pending'
}

const WORKFLOW_STEPS = [
  { name: 'Datos Variables', desc: 'Registrar horas extra, ausencias y complementos del mes', href: '/variables', icon: '✎' },
  { name: 'Generar IC', desc: 'Generar el informe de costes interno con datos fijos y variables', href: '/ic/generate', icon: '⊕' },
  { name: 'Subir IC', desc: 'Cargar el archivo Excel que envia la gestoria', href: '/upload', icon: '↑' },
  { name: 'Reconciliacion', desc: 'Comparar el IC interno con el de la gestoria', href: '/ic/reconcile', icon: '⇄' },
  { name: 'Generar Asiento', desc: 'Crear el asiento contable del mes', href: '/entries', icon: '₪' },
]

const CONFIG_LINKS = [
  { name: 'Empleados', desc: 'Gestionar plantilla', href: '/employees', icon: '◉' },
  { name: 'Departamentos', desc: 'Estructura organizativa', href: '/departments', icon: '▦' },
  { name: 'Conceptos', desc: 'Catalogo salarial', href: '/concepts', icon: '≋' },
  { name: 'Reglas Contables', desc: 'Mapping cuentas', href: '/rules', icon: '⚙' },
]

const STATE_COLORS = {
  completed: 'bg-green-500 text-white',
  in_progress: 'bg-blue-500 text-white',
  pending: 'bg-slate-200 text-slate-500',
}

export default function DashboardPage() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<StepStatus[]>(
    WORKFLOW_STEPS.map(() => ({ label: '', detail: '', state: 'pending' as const }))
  )

  useEffect(() => {
    fetchWorkflowStatus()
  }, [year, month])

  async function fetchWorkflowStatus() {
    setLoading(true)
    const sb = createClient()

    const results = await Promise.allSettled([
      // 1. Datos Variables
      sb.from('monthly_variable_data')
        .select('status')
        .eq('period_year', year)
        .eq('period_month', month),
      // 2. Generated ICs
      sb.from('generated_ics')
        .select('*')
        .eq('period_year', year)
        .eq('period_month', month)
        .order('created_at', { ascending: false })
        .limit(1),
      // 3. Uploaded ICs
      fetch('/api/ic/list').then(r => r.json()),
      // 4. Accounting entries
      sb.from('accounting_entries')
        .select('*')
        .eq('period_year', year)
        .eq('period_month', month)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    const newStatuses: StepStatus[] = []

    // Step 1: Datos Variables
    if (results[0].status === 'fulfilled') {
      const rows = results[0].value.data || []
      const total = rows.length
      const approved = rows.filter((r: { status: string }) => r.status === 'approved').length
      const pending = rows.filter((r: { status: string }) => r.status !== 'approved' && r.status !== 'rejected').length
      if (total === 0) {
        newStatuses.push({ label: 'Sin registros', detail: '', state: 'pending' })
      } else if (pending === 0) {
        newStatuses.push({ label: `${approved} registros aprobados`, detail: '', state: 'completed' })
      } else {
        newStatuses.push({ label: `${total} registros`, detail: `${pending} pendientes de aprobar`, state: 'in_progress' })
      }
    } else {
      newStatuses.push({ label: 'Error al consultar', detail: '', state: 'pending' })
    }

    // Step 2: Generar IC
    if (results[1].status === 'fulfilled') {
      const ics = results[1].value.data || []
      if (ics.length === 0) {
        newStatuses.push({ label: 'Pendiente', detail: '', state: 'pending' })
      } else {
        const ic = ics[0]
        const status = ic.status === 'confirmed' ? 'completed' : 'in_progress'
        newStatuses.push({ label: ic.status === 'confirmed' ? 'IC confirmado' : 'Borrador generado', detail: '', state: status })
      }
    } else {
      newStatuses.push({ label: 'Error al consultar', detail: '', state: 'pending' })
    }

    // Step 3: Subir IC
    if (results[2].status === 'fulfilled') {
      const uploads = results[2].value.uploads || []
      const periodUploads = uploads.filter((u: { periodStart?: string }) => {
        if (!u.periodStart) return false
        const d = new Date(u.periodStart)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      if (periodUploads.length > 0) {
        newStatuses.push({ label: 'Archivo subido', detail: periodUploads[0].filename || '', state: 'completed' })
      } else {
        newStatuses.push({ label: 'Pendiente', detail: '', state: 'pending' })
      }
    } else {
      newStatuses.push({ label: 'Pendiente', detail: '', state: 'pending' })
    }

    // Step 4: Reconciliacion (derived from generated IC status)
    if (results[1].status === 'fulfilled') {
      const ics = results[1].value.data || []
      if (ics.length > 0 && ics[0].status === 'reconciled') {
        newStatuses.push({ label: 'Reconciliado', detail: '', state: 'completed' })
      } else if (ics.length > 0) {
        newStatuses.push({ label: 'Pendiente', detail: 'IC generado, falta reconciliar', state: 'in_progress' })
      } else {
        newStatuses.push({ label: 'Pendiente', detail: '', state: 'pending' })
      }
    } else {
      newStatuses.push({ label: 'Pendiente', detail: '', state: 'pending' })
    }

    // Step 5: Generar Asiento
    if (results[3].status === 'fulfilled') {
      const entries = results[3].value.data || []
      if (entries.length === 0) {
        newStatuses.push({ label: 'Pendiente', detail: '', state: 'pending' })
      } else {
        const entry = entries[0]
        const status = entry.status === 'confirmed' ? 'completed' : 'in_progress'
        newStatuses.push({ label: entry.status === 'confirmed' ? 'Asiento confirmado' : 'Borrador creado', detail: '', state: status })
      }
    } else {
      newStatuses.push({ label: 'Error al consultar', detail: '', state: 'pending' })
    }

    setStatuses(newStatuses)
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ciclo Mensual</h1>
          <p className="text-slate-500 mt-1">
            Sigue los 5 pasos para completar las nominas del mes
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-3">
        {WORKFLOW_STEPS.map((step, i) => {
          const status = statuses[i]
          return (
            <div
              key={step.href}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-5 hover:shadow-sm transition-shadow"
            >
              {/* Step Number */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${STATE_COLORS[status.state]}`}>
                {status.state === 'completed' ? '✓' : i + 1}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{step.icon}</span>
                  <h3 className="font-semibold text-slate-900">{step.name}</h3>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
              </div>

              {/* Status */}
              <div className="text-right shrink-0">
                {loading ? (
                  <span className="text-sm text-slate-400">Cargando...</span>
                ) : (
                  <>
                    <p className={`text-sm font-medium ${
                      status.state === 'completed' ? 'text-green-600' :
                      status.state === 'in_progress' ? 'text-blue-600' :
                      'text-slate-400'
                    }`}>
                      {status.label}
                    </p>
                    {status.detail && (
                      <p className="text-xs text-slate-400 mt-0.5">{status.detail}</p>
                    )}
                  </>
                )}
              </div>

              {/* Go Button */}
              <Link
                href={step.href}
                className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Ir →
              </Link>
            </div>
          )
        })}
      </div>

      {/* Configuration Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Configuracion
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CONFIG_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="text-xl mb-2">{link.icon}</div>
              <h3 className="font-medium text-slate-900 text-sm">{link.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
