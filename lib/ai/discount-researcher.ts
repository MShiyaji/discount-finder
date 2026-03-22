import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DiscountInfo, DiscountType } from '@/lib/scrapers/types'

const DISCOUNT_TYPES: DiscountType[] = [
  'student',
  'seasonal',
  'bundle',
  'military',
  'senior',
  'nonprofit',
  'referral',
  'loyalty',
  'regional',
  'employer',
  'credit_card',
  'free_tier',
]

// Gemini structured output schema (JSON Schema format)
const discountResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    discounts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: [
              'student',
              'seasonal',
              'bundle',
              'military',
              'senior',
              'nonprofit',
              'referral',
              'loyalty',
              'regional',
              'employer',
              'credit_card',
              'free_tier',
            ],
            description: 'The type of discount',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Brief description of the discount',
          },
          discount_amount: {
            type: SchemaType.STRING,
            nullable: true,
            description:
              'Fixed discount amount if applicable, e.g., "$5 off"',
          },
          discount_percentage: {
            type: SchemaType.NUMBER,
            nullable: true,
            description:
              'Percentage discount if applicable, e.g., 50 for 50% off',
          },
          eligibility_requirements: {
            type: SchemaType.STRING,
            nullable: true,
            description: 'Who qualifies for this discount',
          },
          how_to_claim: {
            type: SchemaType.STRING,
            nullable: true,
            description: 'Steps to claim the discount',
          },
          valid_from: {
            type: SchemaType.STRING,
            nullable: true,
            description: 'Start date if seasonal (ISO format)',
          },
          valid_until: {
            type: SchemaType.STRING,
            nullable: true,
            description: 'End date if seasonal (ISO format)',
          },
          source_url: {
            type: SchemaType.STRING,
            nullable: true,
            description: 'URL where this discount was found',
          },
          confidence_score: {
            type: SchemaType.NUMBER,
            description:
              'How confident you are this information is accurate (0-100)',
          },
        },
        required: ['type', 'description', 'confidence_score'],
      },
    },
  },
  required: ['discounts'],
}

const SYSTEM_PROMPT = `You are a discount research assistant. Your job is to find all available discounts and savings opportunities for software and services.

For each service, research and report on these discount types:
- student: Educational discounts for students with .edu emails or student ID
- seasonal: Black Friday, Cyber Monday, summer sales, holiday deals (include historical patterns)
- bundle: Included free with other services (e.g., "Apple TV+ free with Apple devices")
- military: Discounts for military, veterans, first responders
- senior: Senior citizen discounts
- nonprofit: Discounts for nonprofits and charities
- referral: Referral programs that give credits or discounts
- loyalty: Retention offers, cancel-to-get-discount offers
- regional: Different pricing in different countries
- employer: Corporate discounts, company perks programs
- credit_card: Credit card benefits (e.g., "3 months free with Chase Sapphire")
- free_tier: Free plans or tiers available

Be thorough but only report discounts you have high confidence actually exist.
Include source URLs when possible.
For seasonal discounts, note historical patterns (e.g., "Usually 40% off during Black Friday").`

/**
 * Researches discounts for a given service using Gemini AI
 */
export async function researchServiceDiscounts(
  serviceName: string,
  serviceWebsite: string | null
): Promise<DiscountInfo[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: discountResponseSchema,
      maxOutputTokens: 4000,
    },
  })

  const websiteInfo = serviceWebsite ? ` (${serviceWebsite})` : ''

  const searchQueries = [
    `${serviceName} student discount education pricing`,
    `${serviceName} black friday cyber monday deals history`,
    `${serviceName} bundle deal included free with`,
    `${serviceName} military veteran discount`,
    `${serviceName} nonprofit charity discount`,
    `${serviceName} referral program credits`,
    `${serviceName} free tier free plan pricing`,
    `${serviceName} corporate enterprise discount employer perk`,
  ]

  const prompt = `Research all available discounts and savings opportunities for: ${serviceName}${websiteInfo}

Search for information about:
${searchQueries.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Return a comprehensive list of all discounts found. For each discount, include:
- The type of discount
- A clear description
- The discount amount or percentage
- Who is eligible
- How to claim it
- When it's valid (if seasonal)
- Source URL if available
- Your confidence score (0-100)

Only include discounts you're confident actually exist. If you're unsure about a discount, either omit it or give it a low confidence score.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    const parsed = JSON.parse(text)

    return parsed.discounts || []
  } catch (error) {
    console.error(`Error researching ${serviceName}:`, error)
    return []
  }
}

/**
 * Saves researched discounts to the database
 */
export async function saveDiscounts(
  supabase: SupabaseClient,
  serviceId: string,
  discounts: DiscountInfo[]
): Promise<{ saved: number; errors: string[] }> {
  let saved = 0
  const errors: string[] = []

  for (const discount of discounts) {
    try {
      // Upsert based on service_id and discount_type
      const { error } = await supabase.from('discounts').upsert(
        {
          service_id: serviceId,
          discount_type: discount.type,
          description: discount.description,
          discount_amount: discount.discount_amount,
          discount_percentage: discount.discount_percentage,
          eligibility_requirements: discount.eligibility_requirements,
          how_to_claim: discount.how_to_claim,
          valid_from: discount.valid_from,
          valid_until: discount.valid_until,
          source_url: discount.source_url,
          confidence_score: discount.confidence_score,
          last_verified_at: new Date().toISOString(),
        },
        {
          onConflict: 'service_id,discount_type',
        }
      )

      if (error) {
        errors.push(`${discount.type}: ${error.message}`)
      } else {
        saved++
      }
    } catch (err) {
      errors.push(
        `${discount.type}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  return { saved, errors }
}

/**
 * Full research pipeline for a service
 */
export async function researchAndSaveDiscounts(
  supabase: SupabaseClient,
  serviceId: string,
  serviceName: string,
  serviceWebsite: string | null
): Promise<{
  discountsFound: number
  saved: number
  errors: string[]
}> {
  // Research discounts using Gemini AI
  const discounts = await researchServiceDiscounts(serviceName, serviceWebsite)

  if (discounts.length === 0) {
    return { discountsFound: 0, saved: 0, errors: [] }
  }

  // Save to database
  const { saved, errors } = await saveDiscounts(supabase, serviceId, discounts)

  // Update last_researched_at on the service
  await supabase
    .from('services')
    .update({ last_researched_at: new Date().toISOString() })
    .eq('id', serviceId)

  return {
    discountsFound: discounts.length,
    saved,
    errors,
  }
}

/**
 * Batch research multiple services
 */
export async function batchResearchServices(
  supabase: SupabaseClient,
  services: { id: string; name: string; website: string | null }[],
  onProgress?: (current: number, total: number, serviceName: string) => void
): Promise<{
  totalServices: number
  totalDiscounts: number
  errors: string[]
}> {
  let totalDiscounts = 0
  const allErrors: string[] = []

  for (let i = 0; i < services.length; i++) {
    const service = services[i]
    onProgress?.(i + 1, services.length, service.name)

    try {
      const result = await researchAndSaveDiscounts(
        supabase,
        service.id,
        service.name,
        service.website
      )
      totalDiscounts += result.saved
      allErrors.push(...result.errors.map((e) => `${service.name}: ${e}`))

      // Small delay to avoid rate limiting
      if (i < services.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (err) {
      allErrors.push(
        `${service.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    }
  }

  return {
    totalServices: services.length,
    totalDiscounts,
    errors: allErrors,
  }
}
