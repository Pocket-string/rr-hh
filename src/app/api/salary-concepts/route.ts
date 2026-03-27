import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { salaryConceptCreateSchema } from '@/features/salary-concepts/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('salary_concepts')
      .select('*')
      .order('code')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener conceptos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const parsed = salaryConceptCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('salary_concepts')
      .insert(parsed.data)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear concepto' },
      { status: 500 }
    )
  }
}
