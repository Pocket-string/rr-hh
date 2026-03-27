import * as XLSX from 'xlsx'
import type { ICUpload, ICEmployee, ICLine } from '../types'

/**
 * Parsea el archivo Excel IC de nominas de Peixos Puignau.
 *
 * Estructura del Excel (basada en IC Feb 2026):
 * - Fila 2 (idx 1): Moneda ("Moneda: Euro")
 * - Fila 3 (idx 2): Tipo pago ("PAGAMENT MENSUAL + LIQUIDACIÓ")
 * - Fila 4 (idx 3): Periodo en col A + codigos empleado desde col D
 * - Fila 5 (idx 4): Empresa en col A + apellido 1 por empleado
 * - Fila 6 (idx 5): Apellido 2 por empleado
 * - Fila 7 (idx 6): Nombre por empleado
 * - Fila 9 (idx 8): "CONCEPTE"
 * - Filas 11+ (idx 10+): Conceptos salariales
 *   - Col B: codigo concepto, Col C: nombre concepto, Col D+: importe
 * - Fila "TOTAL BRUT": totales por empleado
 * - Hoja 2: Resumen totales (para validacion cruzada)
 */
export function parseICExcel(buffer: ArrayBuffer, filename: string): ICUpload {
  const workbook = XLSX.read(buffer, { type: 'array' })

  const sheet1 = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet1) throw new Error('El archivo no contiene hojas de calculo')

  const data = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet1, {
    header: 1,
    defval: null,
  })

  // --- Metadata ---
  const currency = extractCurrency(data[1])
  const paymentType = extractString(data[2], 0)
  const { periodStart, periodEnd } = extractPeriod(data[3])
  const { companyName, companyNIF } = extractCompany(data[4])

  // --- Empleados (fila 4=codigos, 5=apellido1, 6=apellido2, 7=nombre) ---
  const employeeCols = extractEmployeeColumns(data[3])
  const employees: ICEmployee[] = employeeCols.map(({ colIndex, code }) => {
    const lastName1 = extractString(data[4], colIndex) || ''
    const lastName2 = extractString(data[5], colIndex) || ''
    const firstName = extractString(data[6], colIndex) || ''

    return {
      code,
      lastName: [lastName1, lastName2].filter(Boolean).join(' '),
      firstName,
    }
  })

  // --- Conceptos y lineas ---
  const lines: ICLine[] = []
  const totalBrutByEmployee: Record<string, number> = {}
  let totalBrut = 0

  for (let rowIdx = 10; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx]
    if (!row) continue

    const cellA = row[0]

    // Detectar fila TOTAL BRUT
    if (typeof cellA === 'string' && cellA.includes('TOTAL BRUT')) {
      for (const { colIndex, code } of employeeCols) {
        const val = toNumber(row[colIndex])
        totalBrutByEmployee[code] = val
        totalBrut += val
      }
      continue
    }

    // Filas de conceptos: col B = codigo, col C = nombre
    const conceptCode = toNumber(row[1])
    const conceptName = extractString(row, 2)

    if (conceptCode === 0 && !conceptName) continue

    for (const { colIndex, code } of employeeCols) {
      const amount = toNumber(row[colIndex])
      if (amount === 0) continue

      lines.push({
        employeeCode: code,
        conceptCode,
        conceptName: conceptName || `Concepto ${conceptCode}`,
        amount,
      })
    }
  }

  // --- Validacion cruzada con Hoja 2 ---
  const sheet2 = workbook.Sheets[workbook.SheetNames[1]]
  if (sheet2) {
    const data2 = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet2, {
      header: 1,
      defval: null,
    })
    validateWithSummary(data2, totalBrut)
  }

  return {
    filename,
    periodStart,
    periodEnd,
    paymentType: paymentType || '',
    currency: currency || 'EUR',
    companyName: companyName || '',
    companyNIF: companyNIF || '',
    employees,
    lines,
    totalBrutByEmployee,
    totalBrut: Math.round(totalBrut * 100) / 100,
  }
}

// --- Helpers ---

function extractCurrency(row: (string | number | null)[] | undefined): string {
  if (!row) return 'EUR'
  const val = row[0]
  if (typeof val === 'string' && val.includes('Euro')) return 'EUR'
  return 'EUR'
}

function extractString(
  rowOrVal: (string | number | null)[] | string | number | null | undefined,
  colIndex?: number
): string {
  if (rowOrVal === null || rowOrVal === undefined) return ''
  if (Array.isArray(rowOrVal)) {
    if (colIndex === undefined) return ''
    const val = rowOrVal[colIndex]
    return typeof val === 'string' ? val.trim() : val != null ? String(val) : ''
  }
  return typeof rowOrVal === 'string' ? rowOrVal.trim() : String(rowOrVal)
}

function extractPeriod(row: (string | number | null)[] | undefined): {
  periodStart: string
  periodEnd: string
} {
  if (!row) return { periodStart: '', periodEnd: '' }
  const val = extractString(row, 0)

  // Format: "DEL 01/02/26 AL 28/02/26"
  const match = val.match(/DEL\s+(\d{2})\/(\d{2})\/(\d{2})\s+AL\s+(\d{2})\/(\d{2})\/(\d{2})/)
  if (match) {
    const [, d1, m1, y1, d2, m2, y2] = match
    return {
      periodStart: `20${y1}-${m1}-${d1}`,
      periodEnd: `20${y2}-${m2}-${d2}`,
    }
  }

  return { periodStart: '', periodEnd: '' }
}

function extractCompany(row: (string | number | null)[] | undefined): {
  companyName: string
  companyNIF: string
} {
  if (!row) return { companyName: '', companyNIF: '' }
  const val = extractString(row, 0)

  // Format: "Empresa:   350-PEIXOS PUIGNAU S.A. NIF: A17216359"
  const nameMatch = val.match(/\d+-(.+?)\s*NIF:/)
  const nifMatch = val.match(/NIF:\s*(\S+)/)

  return {
    companyName: nameMatch ? nameMatch[1].trim() : '',
    companyNIF: nifMatch ? nifMatch[1].trim() : '',
  }
}

function extractEmployeeColumns(
  row: (string | number | null)[] | undefined
): { colIndex: number; code: string }[] {
  if (!row) return []
  const cols: { colIndex: number; code: string }[] = []

  // Codigos de empleado empiezan desde col D (index 3)
  for (let i = 3; i < row.length; i++) {
    const val = row[i]
    if (val !== null && val !== undefined) {
      const code = typeof val === 'string' ? val : String(val).padStart(6, '0')
      cols.push({ colIndex: i, code })
    }
  }

  return cols
}

function toNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

function validateWithSummary(
  data2: (string | number | null)[][],
  calculatedTotal: number
): void {
  // Buscar TOTAL BRUT en hoja 2
  for (const row of data2) {
    if (!row) continue
    const cellA = row[0]
    if (typeof cellA === 'string' && cellA.includes('TOTAL BRUT')) {
      const summaryTotal = toNumber(row[3]) // Col D en hoja 2
      if (summaryTotal > 0) {
        const diff = Math.abs(calculatedTotal - summaryTotal)
        if (diff > 1) {
          console.warn(
            `Advertencia: diferencia entre total calculado (${calculatedTotal}) y resumen (${summaryTotal}): ${diff}`
          )
        }
      }
      break
    }
  }
}
