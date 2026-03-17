import { NextResponse } from 'next/server'
import { discoverServices, saveDiscoveredServices } from '@/lib/scrapers'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

/**
 * Cron job to discover new services from aggregator sites
 * Runs weekly to find new services to research
 */
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('scraper_jobs')
      .insert({
        job_type: 'discover',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('Failed to create job record:', jobError)
    }

    // Run service discovery
    const { services, errors, stats } = await discoverServices(30)

    // Save discovered services to database
    const saveResult = await saveDiscoveredServices(services)

    const duration = Date.now() - startTime

    // Update job record
    if (job) {
      await supabase
        .from('scraper_jobs')
        .update({
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString(),
          services_processed: services.length,
          discounts_found: 0,
          errors: errors.length > 0 ? errors : null,
          metadata: {
            stats,
            saveResult,
            duration_ms: duration,
          },
        })
        .eq('id', job.id)
    }

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      discovered: services.length,
      inserted: saveResult.inserted,
      updated: saveResult.updated,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Discover cron failed:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
