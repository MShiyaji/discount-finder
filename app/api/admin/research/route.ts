import { NextResponse } from 'next/server'
import { getServicesNeedingResearch } from '@/lib/scrapers'
import { batchResearchServices, researchAndSaveDiscounts } from '@/lib/ai/discount-researcher'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300

/**
 * Manual trigger for discount research
 * POST /api/admin/research
 * Body: { serviceId?: string, limit?: number }
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body = await request.json().catch(() => ({}))
    const { serviceId, limit = 5 } = body

    // If specific service ID provided, research just that one
    if (serviceId) {
      const supabase = await createClient()
      const { data: service, error } = await supabase
        .from('services')
        .select('id, name, website')
        .eq('id', serviceId)
        .single()

      if (error || !service) {
        return NextResponse.json(
          { success: false, error: 'Service not found' },
          { status: 404 }
        )
      }

      const result = await researchAndSaveDiscounts(
        service.id,
        service.name,
        service.website
      )

      return NextResponse.json({
        success: true,
        duration_ms: Date.now() - startTime,
        service: service.name,
        discounts_found: result.discountsFound,
        saved: result.saved,
        errors: result.errors.length > 0 ? result.errors : undefined,
      })
    }

    // Otherwise, research batch of services
    const services = await getServicesNeedingResearch(Math.min(limit, 10))

    if (services.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No services need research',
        services_processed: 0,
      })
    }

    const result = await batchResearchServices(services)

    return NextResponse.json({
      success: true,
      duration_ms: Date.now() - startTime,
      services_processed: result.totalServices,
      discounts_found: result.totalDiscounts,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Manual research failed:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
