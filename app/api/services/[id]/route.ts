import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/services/[id] - Get a single service with its discounts
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('services')
      .select(
        `
        id,
        name,
        description,
        website,
        category,
        source,
        last_researched_at,
        created_at,
        discounts (
          id,
          discount_type,
          description,
          discount_amount,
          discount_percentage,
          eligibility_requirements,
          how_to_claim,
          valid_from,
          valid_until,
          source_url,
          confidence_score,
          last_verified_at
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching service:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
