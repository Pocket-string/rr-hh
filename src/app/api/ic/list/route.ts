import { NextResponse } from 'next/server'
import { getICUploads } from '@/features/ic-upload/services/ic-storage'

export async function GET() {
  try {
    const uploads = await getICUploads()
    return NextResponse.json({ uploads })
  } catch (error) {
    console.error('Error listing ICs:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
