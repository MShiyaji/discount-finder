export interface DiscoveredService {
  name: string
  description: string | null
  website: string | null
  category: string | null
  source: 'product_hunt' | 'g2' | 'alternativeto' | 'manual'
  source_url: string | null
}

export interface ScraperResult {
  services: DiscoveredService[]
  errors: string[]
  source: string
}

export type DiscountType =
  | 'student'
  | 'seasonal'
  | 'bundle'
  | 'military'
  | 'senior'
  | 'nonprofit'
  | 'referral'
  | 'loyalty'
  | 'regional'
  | 'employer'
  | 'credit_card'
  | 'free_tier'

export interface DiscountInfo {
  type: DiscountType
  description: string
  discount_amount: string | null
  discount_percentage: number | null
  eligibility_requirements: string | null
  how_to_claim: string | null
  valid_from: string | null
  valid_until: string | null
  source_url: string | null
  confidence_score: number // 0-100
}

export interface ServiceWithDiscounts {
  service: DiscoveredService
  discounts: DiscountInfo[]
}
