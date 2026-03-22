import { NextResponse } from 'next/server'
import { discoverServices, saveDiscoveredServices } from '@/lib/scrapers'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * Manual trigger for service discovery
 * POST /api/admin/discover
 */
export async function POST() {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Run service discovery
    const { services, errors, stats } = await discoverServices(30)

    // Save discovered services to database
    const saveResult = await saveDiscoveredServices(supabase, services)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      discovered: services.length,
      inserted: saveResult.inserted,
      updated: saveResult.updated,
      stats,
      errors: [...errors, ...saveResult.errors],
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Manual discover failed:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
