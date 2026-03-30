import { createServiceClient } from '@/lib/supabase/server'
import type { ICUpload, ICUploadRecord } from '../types'

export async function saveICToSupabase(
  ic: ICUpload,
  createdBy: string
): Promise<number> {
  const supabase = createServiceClient()

  // 1. Insert ic_uploads
  const { data: upload, error: uploadError } = await supabase
    .from('ic_uploads')
    .insert({
      filename: ic.filename,
      period_start: ic.periodStart,
      period_end: ic.periodEnd,
      payment_type: ic.paymentType,
      currency: ic.currency,
      company_name: ic.companyName,
      company_nif: ic.companyNIF,
      employee_count: ic.employees.length,
      total_brut: ic.totalBrut,
      created_by: createdBy,
    })
    .select('id')
    .single()

  if (uploadError || !upload) {
    throw new Error(`Error al guardar IC: ${uploadError?.message || 'Sin respuesta'}`)
  }

  const uploadId = upload.id

  // 2. Insert employees
  if (ic.employees.length > 0) {
    const empRows = ic.employees.map(emp => ({
      upload_id: uploadId,
      employee_code: emp.code,
      last_name: emp.lastName,
      first_name: emp.firstName,
    }))

    const { error: empError } = await supabase
      .from('ic_employees')
      .insert(empRows)

    if (empError) {
      // Cleanup on failure
      await supabase.from('ic_uploads').delete().eq('id', uploadId)
      throw new Error(`Error al guardar empleados: ${empError.message}`)
    }
  }

  // 3. Insert lines (batch in chunks of 500 to avoid payload limits)
  if (ic.lines.length > 0) {
    const lineRows = ic.lines.map(line => ({
      upload_id: uploadId,
      employee_code: line.employeeCode,
      concept_code: line.conceptCode,
      concept_name: line.conceptName,
      amount: line.amount,
    }))

    const chunkSize = 500
    for (let i = 0; i < lineRows.length; i += chunkSize) {
      const chunk = lineRows.slice(i, i + chunkSize)
      const { error: lineError } = await supabase
        .from('ic_lines')
        .insert(chunk)

      if (lineError) {
        // Cleanup on failure (cascade will remove employees and lines)
        await supabase.from('ic_uploads').delete().eq('id', uploadId)
        throw new Error(`Error al guardar lineas: ${lineError.message}`)
      }
    }
  }

  return uploadId
}

export async function getICUploads(): Promise<ICUploadRecord[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('ic_uploads')
    .select('id, filename, period_start, period_end, company_name, company_nif, employee_count, total_brut, status, created_at, created_by')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al listar ICs: ${error.message}`)

  return (data || []).map(row => ({
    id: row.id,
    filename: row.filename,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    companyName: row.company_name,
    companyNIF: row.company_nif,
    employeeCount: row.employee_count,
    totalBrut: row.total_brut,
    status: row.status,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }))
}

export async function getICUploadById(id: number): Promise<ICUploadRecord | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('ic_uploads')
    .select('id, filename, period_start, period_end, company_name, company_nif, employee_count, total_brut, status, created_at, created_by')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    filename: data.filename,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    companyName: data.company_name,
    companyNIF: data.company_nif,
    employeeCount: data.employee_count,
    totalBrut: data.total_brut,
    status: data.status,
    createdAt: data.created_at,
    createdBy: data.created_by,
  }
}

export async function getICEmployees(uploadId: number) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('ic_employees')
    .select('id, upload_id, employee_code, last_name, first_name, department, cost_center')
    .eq('upload_id', uploadId)
    .order('employee_code')

  if (error) throw new Error(`Error al obtener empleados: ${error.message}`)

  return (data || []).map(row => ({
    id: row.id,
    uploadId: row.upload_id,
    employeeCode: row.employee_code,
    lastName: row.last_name,
    firstName: row.first_name,
    department: row.department,
    costCenter: row.cost_center,
  }))
}

export async function getICLines(uploadId: number) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('ic_lines')
    .select('id, upload_id, employee_code, concept_code, concept_name, amount, concept_type')
    .eq('upload_id', uploadId)
    .order('concept_code')

  if (error) throw new Error(`Error al obtener lineas: ${error.message}`)

  return (data || []).map(row => ({
    id: row.id,
    uploadId: row.upload_id,
    employeeCode: row.employee_code,
    conceptCode: row.concept_code,
    conceptName: row.concept_name,
    amount: row.amount,
    conceptType: row.concept_type,
  }))
}

export async function getICConceptSummary(uploadId: number) {
  const supabase = createServiceClient()

  // Supabase doesn't support GROUP BY directly, so we fetch lines and aggregate in JS
  const { data, error } = await supabase
    .from('ic_lines')
    .select('concept_code, concept_name, amount')
    .eq('upload_id', uploadId)

  if (error) throw new Error(`Error al obtener resumen: ${error.message}`)

  const summary = new Map<number, { conceptCode: number; conceptName: string; employeeCount: number; totalAmount: number }>()

  for (const row of data || []) {
    const existing = summary.get(row.concept_code)
    if (existing) {
      existing.employeeCount++
      existing.totalAmount += Number(row.amount)
    } else {
      summary.set(row.concept_code, {
        conceptCode: row.concept_code,
        conceptName: row.concept_name,
        employeeCount: 1,
        totalAmount: Number(row.amount),
      })
    }
  }

  return Array.from(summary.values()).sort((a, b) => a.conceptCode - b.conceptCode)
}
