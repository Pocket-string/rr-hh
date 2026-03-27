import { getPool, sql } from '@/lib/sqlserver/client'
import type { ICUpload, ICUploadRecord } from '../types'

export async function saveICToSqlServer(
  ic: ICUpload,
  createdBy: string
): Promise<number> {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)

  try {
    await transaction.begin()

    // 1. Insertar ic_uploads
    const uploadResult = await new sql.Request(transaction)
      .input('filename', sql.NVarChar, ic.filename)
      .input('periodStart', sql.Date, ic.periodStart)
      .input('periodEnd', sql.Date, ic.periodEnd)
      .input('paymentType', sql.NVarChar, ic.paymentType)
      .input('currency', sql.NVarChar, ic.currency)
      .input('companyName', sql.NVarChar, ic.companyName)
      .input('companyNIF', sql.NVarChar, ic.companyNIF)
      .input('employeeCount', sql.Int, ic.employees.length)
      .input('totalBrut', sql.Decimal(14, 2), ic.totalBrut)
      .input('createdBy', sql.NVarChar, createdBy)
      .query(`
        INSERT INTO ic_uploads
          (filename, period_start, period_end, payment_type, currency,
           company_name, company_nif, employee_count, total_brut, created_by)
        VALUES
          (@filename, @periodStart, @periodEnd, @paymentType, @currency,
           @companyName, @companyNIF, @employeeCount, @totalBrut, @createdBy);
        SELECT SCOPE_IDENTITY() AS id;
      `)

    const uploadId = uploadResult.recordset[0].id as number

    // 2. Insertar empleados
    const empTable = new sql.Table('ic_employees')
    empTable.columns.add('upload_id', sql.Int)
    empTable.columns.add('employee_code', sql.NVarChar(10))
    empTable.columns.add('last_name', sql.NVarChar(255))
    empTable.columns.add('first_name', sql.NVarChar(255))

    for (const emp of ic.employees) {
      empTable.rows.add(uploadId, emp.code, emp.lastName, emp.firstName)
    }

    await new sql.Request(transaction).bulk(empTable)

    // 3. Insertar lineas (batch)
    const lineTable = new sql.Table('ic_lines')
    lineTable.columns.add('upload_id', sql.Int)
    lineTable.columns.add('employee_code', sql.NVarChar(10))
    lineTable.columns.add('concept_code', sql.Int)
    lineTable.columns.add('concept_name', sql.NVarChar(255))
    lineTable.columns.add('amount', sql.Decimal(12, 2))

    for (const line of ic.lines) {
      lineTable.rows.add(
        uploadId,
        line.employeeCode,
        line.conceptCode,
        line.conceptName,
        line.amount
      )
    }

    await new sql.Request(transaction).bulk(lineTable)

    await transaction.commit()
    return uploadId
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export async function getICUploads(): Promise<ICUploadRecord[]> {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT id, filename, period_start AS periodStart, period_end AS periodEnd,
           company_name AS companyName, company_nif AS companyNIF,
           employee_count AS employeeCount, total_brut AS totalBrut,
           status, created_at AS createdAt, created_by AS createdBy
    FROM ic_uploads
    ORDER BY created_at DESC
  `)
  return result.recordset
}

export async function getICUploadById(id: number): Promise<ICUploadRecord | null> {
  const pool = await getPool()
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id, filename, period_start AS periodStart, period_end AS periodEnd,
             company_name AS companyName, company_nif AS companyNIF,
             employee_count AS employeeCount, total_brut AS totalBrut,
             status, created_at AS createdAt, created_by AS createdBy
      FROM ic_uploads
      WHERE id = @id
    `)
  return result.recordset[0] || null
}

export async function getICEmployees(uploadId: number) {
  const pool = await getPool()
  const result = await pool.request()
    .input('uploadId', sql.Int, uploadId)
    .query(`
      SELECT id, upload_id AS uploadId, employee_code AS employeeCode,
             last_name AS lastName, first_name AS firstName,
             department, cost_center AS costCenter
      FROM ic_employees
      WHERE upload_id = @uploadId
      ORDER BY employee_code
    `)
  return result.recordset
}

export async function getICLines(uploadId: number) {
  const pool = await getPool()
  const result = await pool.request()
    .input('uploadId', sql.Int, uploadId)
    .query(`
      SELECT id, upload_id AS uploadId, employee_code AS employeeCode,
             concept_code AS conceptCode, concept_name AS conceptName,
             amount, concept_type AS conceptType
      FROM ic_lines
      WHERE upload_id = @uploadId
      ORDER BY concept_code, employee_code
    `)
  return result.recordset
}

export async function getICConceptSummary(uploadId: number) {
  const pool = await getPool()
  const result = await pool.request()
    .input('uploadId', sql.Int, uploadId)
    .query(`
      SELECT concept_code AS conceptCode, concept_name AS conceptName,
             COUNT(*) AS employeeCount,
             SUM(amount) AS totalAmount
      FROM ic_lines
      WHERE upload_id = @uploadId
      GROUP BY concept_code, concept_name
      ORDER BY concept_code
    `)
  return result.recordset
}
