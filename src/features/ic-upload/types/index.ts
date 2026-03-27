import { z } from 'zod'

// --- Schemas Zod ---

export const icEmployeeSchema = z.object({
  code: z.string().min(1),
  lastName: z.string(),
  firstName: z.string(),
})

export const icLineSchema = z.object({
  employeeCode: z.string(),
  conceptCode: z.number().int(),
  conceptName: z.string(),
  amount: z.number(),
})

export const icUploadSchema = z.object({
  filename: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  paymentType: z.string(),
  currency: z.string(),
  companyName: z.string(),
  companyNIF: z.string(),
  employees: z.array(icEmployeeSchema),
  lines: z.array(icLineSchema),
  totalBrutByEmployee: z.record(z.string(), z.number()),
  totalBrut: z.number(),
})

// --- Types ---

export type ICEmployee = z.infer<typeof icEmployeeSchema>
export type ICLine = z.infer<typeof icLineSchema>
export type ICUpload = z.infer<typeof icUploadSchema>

export interface ICUploadRecord {
  id: number
  filename: string
  periodStart: string
  periodEnd: string
  companyName: string
  companyNIF: string
  employeeCount: number
  totalBrut: number
  status: 'uploaded' | 'validated' | 'processed' | 'sent'
  createdAt: string
  createdBy: string
}

export interface ICEmployeeRecord {
  id: number
  uploadId: number
  employeeCode: string
  lastName: string
  firstName: string
  department: string | null
  costCenter: string | null
}

export interface ICLineRecord {
  id: number
  uploadId: number
  employeeCode: string
  conceptCode: number
  conceptName: string
  amount: number
  conceptType: string | null
}
