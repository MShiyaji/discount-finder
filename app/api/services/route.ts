import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/services - List all services with their discounts
 * Query params: search, category, limit, offset
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const supabase = await createClient()

    let query = supabase
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
      `,
        { count: 'exact' }
      )
      .order('name')
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
