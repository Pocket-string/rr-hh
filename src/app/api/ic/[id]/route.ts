import { NextRequest, NextResponse } from 'next/server'
import {
  getICUploadById,
  getICEmployees,
  getICConceptSummary,
} from '@/features/ic-upload/services/ic-storage'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const uploadId = parseInt(id)

    if (isNaN(uploadId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
    }

    const upload = await getICUploadById(uploadId)
    if (!upload) {
      return NextResponse.json({ error: 'IC no encontrado' }, { status: 404 })
    }

    const [employees, conceptSummary] = await Promise.all([
      getICEmployees(uploadId),
      getICConceptSummary(uploadId),
    ])

    return NextResponse.json({
      upload,
      employees,
      conceptSummary,
    })
  } catch (error) {
    console.error('Error fetching IC:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
