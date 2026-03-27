'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MONTH_NAMES } from '@/features/variable-data/types'
import type { GeneratedIC } from '../types'

type DiffLine = {
  employeeCode: string
  employeeName: string
  conceptCode: number
  conceptName: string
  generatedAmount: number
  excelAmount: number
  diff: number
  status: 'match' | 'diff' | 'only_generated' | 'only_excel'
}

type ReconciliationResult = {
  totalGenerado: number
  totalExcel: number
  totalDiff: number
  matchCount: number
  diffCount: number
  onlyGeneratedCount: number
  onlyExcelCount: number
  lines: DiffLine[]
}

export function ReconciliationView() {
  const [ics, setICs] = useState<GeneratedIC[]>([])
  const [selectedICId, setSelectedICId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ReconciliationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingICs, setLoadingICs] = useState(true)

  // Load generated ICs on mount
  useEffect(() => {
    const sb = createClient()
    sb.from('generated_ics')
      .select('*')
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .then(({ data }) => {
        setICs((data as GeneratedIC[]) || [])
        setLoadingICs(false)
      })
  }, [])

  const handleReconcile = useCallback(async () => {
    if (!selectedICId || !file) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // 1. Load generated IC lines from Supabase
      const sb = createClient()
      const { data: icLines } = await sb
        .from('generated_ic_lines')
        .select(`
          *,
          employees!generated_ic_lines_employee_id_fkey(employee_code, first_name, last_name),
          salary_concepts!generated_ic_lines_concept_id_fkey(code, name)
        `)
        .eq('generated_ic_id', selectedICId)

      // 2. Parse Excel file using xlsx
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })

      // Parse employee codes from row 4 (index 3), starting col D (index 3)
      const row4 = rawData[3] as (string | number)[]
      const employeeCodes: string[] = []
      const colMap: Record<string, number> = {}

      for (let c = 3; c < (row4?.length || 0); c++) {
        const code = String(row4[c] || '').trim()
        if (code && /^\d+$/.test(code)) {
          const paddedCode = code.padStart(6, '0')
          employeeCodes.push(paddedCode)
          colMap[paddedCode] = c
        }
      }

      // Parse employee names from rows 6-8 (indices 5-7)
      const row6 = rawData[5] as (string | number)[]
      const row7 = rawData[6] as (string | number)[]
      const row8 = rawData[7] as (string | number)[]
      const employeeNames: Record<string, string> = {}
      for (const code of employeeCodes) {
        const col = colMap[code]
        const ln1 = String(row6?.[col] || '').trim()
        const ln2 = String(row7?.[col] || '').trim()
        const fn = String(row8?.[col] || '').trim()
        const lastName = [ln1, ln2].filter(Boolean).join(' ')
        employeeNames[code] = `${lastName}, ${fn}`
      }

      // Parse concept lines from row 10+ (index 9+)
      type ExcelLine = { employeeCode: string; conceptCode: number; conceptName: string; amount: number }
      const excelLines: ExcelLine[] = []

      for (let r = 9; r < rawData.length; r++) {
        const row = rawData[r] as (string | number)[]
        if (!row) continue
        const conceptCode = Number(row[1])
        const conceptName = String(row[2] || '').trim()
        if (!conceptCode || !conceptName) continue
        if (conceptName.toUpperCase().includes('TOTAL BRUT')) break

        for (const code of employeeCodes) {
          const col = colMap[code]
          const amount = Number(row[col] || 0)
          if (amount !== 0) {
            excelLines.push({ employeeCode: code, conceptCode, conceptName, amount })
          }
        }
      }

      // 3. Build comparison
      // Key: employeeCode_conceptCode
      const generatedMap = new Map<string, { amount: number; employeeName: string; conceptName: string; conceptCode: number; employeeCode: string }>()

      for (const line of (icLines || [])) {
        const emp = line.employees as unknown as { employee_code: string; first_name: string; last_name: string } | null
        const concept = line.salary_concepts as unknown as { code: number; name: string } | null
        if (!emp || !concept) continue
        const key = `${emp.employee_code}_${concept.code}`
        generatedMap.set(key, {
          amount: line.amount,
          employeeName: `${emp.last_name}, ${emp.first_name}`,
          conceptName: concept.name,
          conceptCode: concept.code,
          employeeCode: emp.employee_code,
        })
      }

      const excelMap = new Map<string, { amount: number; employeeName: string; conceptName: string; conceptCode: number; employeeCode: string }>()

      for (const line of excelLines) {
        const key = `${line.employeeCode}_${line.conceptCode}`
        excelMap.set(key, {
          amount: line.amount,
          employeeName: employeeNames[line.employeeCode] || line.employeeCode,
          conceptName: line.conceptName,
          conceptCode: line.conceptCode,
          employeeCode: line.employeeCode,
        })
      }

      const allKeys = new Set([...generatedMap.keys(), ...excelMap.keys()])
      const diffLines: DiffLine[] = []
      const TOLERANCE = 0.02 // 2 centimos

      for (const key of allKeys) {
        const gen = generatedMap.get(key)
        const excel = excelMap.get(key)

        if (gen && excel) {
          const diff = Math.abs(gen.amount - excel.amount)
          diffLines.push({
            employeeCode: gen.employeeCode,
            employeeName: gen.employeeName,
            conceptCode: gen.conceptCode,
            conceptName: gen.conceptName,
            generatedAmount: gen.amount,
            excelAmount: excel.amount,
            diff: gen.amount - excel.amount,
            status: diff <= TOLERANCE ? 'match' : 'diff',
          })
        } else if (gen && !excel) {
          diffLines.push({
            employeeCode: gen.employeeCode,
            employeeName: gen.employeeName,
            conceptCode: gen.conceptCode,
            conceptName: gen.conceptName,
            generatedAmount: gen.amount,
            excelAmount: 0,
            diff: gen.amount,
            status: 'only_generated',
          })
        } else if (!gen && excel) {
          diffLines.push({
            employeeCode: excel.employeeCode,
            employeeName: excel.employeeName,
            conceptCode: excel.conceptCode,
            conceptName: excel.conceptName,
            generatedAmount: 0,
            excelAmount: excel.amount,
            diff: -excel.amount,
            status: 'only_excel',
          })
        }
      }

      // Sort by employee code, then concept code
      diffLines.sort((a, b) => a.employeeCode.localeCompare(b.employeeCode) || a.conceptCode - b.conceptCode)

      const totalGen = diffLines.reduce((s, l) => s + l.generatedAmount, 0)
      const totalExcel = diffLines.reduce((s, l) => s + l.excelAmount, 0)

      setResult({
        totalGenerado: totalGen,
        totalExcel: totalExcel,
        totalDiff: totalGen - totalExcel,
        matchCount: diffLines.filter((l) => l.status === 'match').length,
        diffCount: diffLines.filter((l) => l.status === 'diff').length,
        onlyGeneratedCount: diffLines.filter((l) => l.status === 'only_generated').length,
        onlyExcelCount: diffLines.filter((l) => l.status === 'only_excel').length,
        lines: diffLines,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en reconciliacion')
    }
    setLoading(false)
  }, [selectedICId, file])

  const statusColors: Record<string, string> = {
    match: 'bg-green-50',
    diff: 'bg-red-50',
    only_generated: 'bg-blue-50',
    only_excel: 'bg-amber-50',
  }

  const statusLabels: Record<string, string> = {
    match: 'OK',
    diff: 'Diferencia',
    only_generated: 'Solo interno',
    only_excel: 'Solo Excel',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reconciliacion IC</h1>
        <p className="text-slate-500 mt-1">
          Compara el IC generado internamente con el Excel de la gestoria
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IC Generado</label>
            <select
              value={selectedICId}
              onChange={(e) => setSelectedICId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              disabled={loadingICs}
            >
              <option value="">Seleccionar IC generado</option>
              {ics.map((ic) => (
                <option key={ic.id} value={ic.id}>
                  {MONTH_NAMES[ic.period_month - 1]} {ic.period_year} — {ic.employee_count} emp — {ic.total_brut.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Excel Gestoria (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleReconcile}
          disabled={!selectedICId || !file || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Comparando...' : 'Comparar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <p className="text-sm text-green-700">Coincidencias</p>
              <p className="text-2xl font-bold text-green-800">{result.matchCount}</p>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <p className="text-sm text-red-700">Diferencias</p>
              <p className="text-2xl font-bold text-red-800">{result.diffCount}</p>
            </div>
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <p className="text-sm text-blue-700">Solo Interno</p>
              <p className="text-2xl font-bold text-blue-800">{result.onlyGeneratedCount}</p>
            </div>
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm text-amber-700">Solo Excel</p>
              <p className="text-2xl font-bold text-amber-800">{result.onlyExcelCount}</p>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex gap-8 text-sm">
              <div>
                <span className="text-slate-500">Total Generado:</span>{' '}
                <span className="font-bold">{result.totalGenerado.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Excel:</span>{' '}
                <span className="font-bold">{result.totalExcel.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              </div>
              <div>
                <span className="text-slate-500">Diferencia:</span>{' '}
                <span className={`font-bold ${Math.abs(result.totalDiff) <= 0.02 ? 'text-green-700' : 'text-red-700'}`}>
                  {result.totalDiff.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Empleado</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Concepto</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Generado</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Excel</th>
                  <th className="text-right px-4 py-3 text-slate-500 font-medium">Diff</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.lines.map((line, i) => (
                  <tr key={i} className={statusColors[line.status]}>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-slate-400 mr-1">{line.employeeCode}</span>
                      <span className="text-slate-900">{line.employeeName}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs text-slate-400 mr-1">{line.conceptCode}</span>
                      {line.conceptName}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {line.generatedAmount ? line.generatedAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {line.excelAmount ? line.excelAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {line.diff !== 0 && (
                        <span className={line.diff > 0 ? 'text-green-700' : 'text-red-700'}>
                          {line.diff > 0 ? '+' : ''}{line.diff.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        line.status === 'match' ? 'bg-green-100 text-green-700' :
                        line.status === 'diff' ? 'bg-red-100 text-red-700' :
                        line.status === 'only_generated' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {statusLabels[line.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
