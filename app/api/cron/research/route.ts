import { NextResponse } from 'next/server'
import { getServicesNeedingResearch } from '@/lib/scrapers'
import { batchResearchServices } from '@/lib/ai/discount-researcher'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300 // 5 minutes for AI research

/**
 * Cron job to research discounts for services
 * Runs weekly to update discount information
 * Processes 10 services per run to stay within limits
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
        job_type: 'research',
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('Failed to create job record:', jobError)
    }

    // Get services that need research
    const services = await getServicesNeedingResearch(10)

    if (services.length === 0) {
      // Update job as completed with no work
      if (job) {
        await supabase
          .from('scraper_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            services_processed: 0,
            discounts_found: 0,
            metadata: { message: 'No services needed research' },
          })
          .eq('id', job.id)
      }

      return NextResponse.json({
        success: true,
        message: 'No services needed research',
        services_processed: 0,
      })
    }

    // Research discounts for each service
    const result = await batchResearchServices(services)

    const duration = Date.now() - startTime

    // Update job record
    if (job) {
      await supabase
        .from('scraper_jobs')
        .update({
          status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
          completed_at: new Date().toISOString(),
          services_processed: result.totalServices,
          discounts_found: result.totalDiscounts,
          errors: result.errors.length > 0 ? result.errors : null,
          metadata: {
            services_researched: services.map((s) => s.name),
            duration_ms: duration,
          },
        })
        .eq('id', job.id)
    }

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      services_processed: result.totalServices,
      discounts_found: result.totalDiscounts,
      errors: result.errors.length > 0 ? result.errors : undefined,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Research cron failed:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
