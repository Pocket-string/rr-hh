import { NextRequest, NextResponse } from 'next/server'
import { parseICExcel } from '@/features/ic-upload/services/ic-parser'
import { saveICToSupabase } from '@/features/ic-upload/services/ic-storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibio ningun archivo' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'El archivo debe ser un Excel (.xlsx o .xls)' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const ic = parseICExcel(buffer, file.name)

    if (ic.employees.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron empleados en el archivo' },
        { status: 400 }
      )
    }

    if (ic.lines.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron conceptos salariales en el archivo' },
        { status: 400 }
      )
    }

    // TODO: obtener usuario autenticado de Supabase
    const createdBy = 'system'

    const uploadId = await saveICToSupabase(ic, createdBy)

    return NextResponse.json({
      id: uploadId,
      filename: ic.filename,
      period: `${ic.periodStart} - ${ic.periodEnd}`,
      company: ic.companyName,
      employeeCount: ic.employees.length,
      conceptCount: new Set(ic.lines.map(l => l.conceptCode)).size,
      lineCount: ic.lines.length,
      totalBrut: ic.totalBrut,
    })
  } catch (error) {
    console.error('Error uploading IC:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
