import { scrapeProductHunt } from './product-hunt'
import { scrapeG2 } from './g2'
import { scrapeAlternativeTo } from './alternativeto'
import type { DiscoveredService, ScraperResult } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

export * from './types'

/**
 * Runs all service discovery scrapers and deduplicates results
 */
export async function discoverServices(
  limitPerSource: number = 30
): Promise<{
  services: DiscoveredService[]
  errors: string[]
  stats: {
    productHunt: number
    g2: number
    alternativeTo: number
    duplicatesRemoved: number
  }
}> {
  // Run all scrapers in parallel
  const [productHuntResult, g2Result, alternativeToResult] = await Promise.all([
    scrapeProductHunt(limitPerSource),
    scrapeG2(limitPerSource),
    scrapeAlternativeTo(limitPerSource),
  ])

  // Collect all services
  const allServices: DiscoveredService[] = [
    ...productHuntResult.services,
    ...g2Result.services,
    ...alternativeToResult.services,
  ]

  // Deduplicate by normalized name
  const seen = new Map<string, DiscoveredService>()
  for (const service of allServices) {
    const normalizedName = normalizeServiceName(service.name)
    if (!seen.has(normalizedName)) {
      seen.set(normalizedName, service)
    } else {
      // Prefer the one with more data
      const existing = seen.get(normalizedName)!
      if (
        (service.website && !existing.website) ||
        (service.description && !existing.description)
      ) {
        seen.set(normalizedName, {
          ...existing,
          website: service.website || existing.website,
          description: service.description || existing.description,
        })
      }
    }
  }

  const uniqueServices = Array.from(seen.values())
  const duplicatesRemoved = allServices.length - uniqueServices.length

  return {
    services: uniqueServices,
    errors: [
      ...productHuntResult.errors,
      ...g2Result.errors,
      ...alternativeToResult.errors,
    ],
    stats: {
      productHunt: productHuntResult.services.length,
      g2: g2Result.services.length,
      alternativeTo: alternativeToResult.services.length,
      duplicatesRemoved,
    },
  }
}

/**
 * Normalizes a service name for deduplication
 */
function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Saves discovered services to the database
 */
export async function saveDiscoveredServices(
  supabase: SupabaseClient,
  services: DiscoveredService[]
): Promise<{
  inserted: number
  updated: number
  errors: string[]
}> {
  let inserted = 0
  let updated = 0
  const errors: string[] = []

  for (const service of services) {
    try {
      // Check if service already exists by normalized name
      const normalizedName = normalizeServiceName(service.name)
      const { data: existing } = await supabase
        .from('services')
        .select('id, name')
        .ilike('name', service.name)
        .single()

      if (existing) {
        // Update if we have more data
        const { error: updateError } = await supabase
          .from('services')
          .update({
            description: service.description,
            website: service.website || undefined,
            category: service.category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          errors.push(`Update ${service.name}: ${updateError.message}`)
        } else {
          updated++
        }
      } else {
        // Insert new service
        const { error: insertError } = await supabase.from('services').insert({
          name: service.name,
          normalized_name: normalizedName,
          description: service.description,
          website: service.website,
          category: service.category,
          source: service.source,
          source_url: service.source_url,
        })

        if (insertError) {
          // Might be a duplicate due to race condition
          if (!insertError.message.includes('duplicate')) {
            errors.push(`Insert ${service.name}: ${insertError.message}`)
          }
        } else {
          inserted++
        }
      }
    } catch (err) {
      errors.push(
        `${service.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  return { inserted, updated, errors }
}

/**
 * Gets services that need discount research
 */
export async function getServicesNeedingResearch(
  supabase: SupabaseClient,
  limit: number = 10
): Promise<{ id: string; name: string; website: string | null }[]> {
  // Get services that haven't been researched in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('services')
    .select('id, name, website')
    .or(`last_researched_at.is.null,last_researched_at.lt.${sevenDaysAgo.toISOString()}`)
    .order('last_researched_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  return data || []
}

/**
 * Marks a service as researched
 */
export async function markServiceResearched(
  supabase: SupabaseClient,
  serviceId: string
): Promise<void> {
  await supabase
    .from('services')
    .update({ last_researched_at: new Date().toISOString() })
    .eq('id', serviceId)
}
