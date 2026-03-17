import type { DiscoveredService, ScraperResult } from './types'

const G2_CATEGORIES = [
  'project-management',
  'video-conferencing',
  'crm',
  'marketing-automation',
  'accounting',
  'hr-software',
  'design-software',
  'ai-writing-assistant',
  'code-editors',
  'cloud-storage',
]

/**
 * Scrapes G2 for popular software products
 */
export async function scrapeG2(limit: number = 50): Promise<ScraperResult> {
  const services: DiscoveredService[] = []
  const errors: string[] = []

  try {
    for (const category of G2_CATEGORIES.slice(0, 5)) {
      try {
        const response = await fetch(
          `https://www.g2.com/categories/${category}`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; DiscountFinder/1.0; +https://example.com)',
              Accept: 'text/html',
            },
          }
        )

        if (!response.ok) {
          errors.push(`G2 ${category}: HTTP ${response.status}`)
          continue
        }

        const html = await response.text()

        // Extract product names from G2's HTML structure
        const productMatches = html.matchAll(
          /itemprop="name"[^>]*>([^<]+)</g
        )
        const descMatches = html.matchAll(
          /itemprop="description"[^>]*>([^<]+)</g
        )

        const products = [...productMatches].map((m) => m[1].trim())
        const descriptions = [...descMatches].map((m) => m[1].trim())

        for (let i = 0; i < Math.min(products.length, 10); i++) {
          const name = products[i]
          if (name && !services.some((s) => s.name === name)) {
            services.push({
              name,
              description: descriptions[i] || null,
              website: null,
              category: formatCategory(category),
              source: 'g2',
              source_url: `https://www.g2.com/categories/${category}`,
            })
          }
        }

        if (services.length >= limit) break
      } catch (err) {
        errors.push(
          `G2 ${category}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }

    // Fallback to curated list if scraping doesn't work
    if (services.length < 10) {
      const fallbackProducts = getFallbackG2Products()
      for (const product of fallbackProducts) {
        if (!services.some((s) => s.name === product.name)) {
          services.push(product)
        }
        if (services.length >= limit) break
      }
    }
  } catch (err) {
    errors.push(
      `G2 general error: ${err instanceof Error ? err.message : 'Unknown error'}`
    )
  }

  return {
    services: services.slice(0, limit),
    errors,
    source: 'g2',
  }
}

function formatCategory(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getFallbackG2Products(): DiscoveredService[] {
  return [
    {
      name: 'Slack',
      description: 'Business communication platform',
      website: 'https://slack.com',
      category: 'Communication',
      source: 'g2',
      source_url: 'https://www.g2.com/products/slack',
    },
    {
      name: 'Zoom',
      description: 'Video conferencing and online meetings',
      website: 'https://zoom.us',
      category: 'Video Conferencing',
      source: 'g2',
      source_url: 'https://www.g2.com/products/zoom',
    },
    {
      name: 'Salesforce',
      description: 'CRM and sales platform',
      website: 'https://salesforce.com',
      category: 'CRM',
      source: 'g2',
      source_url: 'https://www.g2.com/products/salesforce',
    },
    {
      name: 'HubSpot',
      description: 'Marketing and sales software',
      website: 'https://hubspot.com',
      category: 'Marketing Automation',
      source: 'g2',
      source_url: 'https://www.g2.com/products/hubspot',
    },
    {
      name: 'Asana',
      description: 'Work management platform',
      website: 'https://asana.com',
      category: 'Project Management',
      source: 'g2',
      source_url: 'https://www.g2.com/products/asana',
    },
    {
      name: 'Monday.com',
      description: 'Work operating system',
      website: 'https://monday.com',
      category: 'Project Management',
      source: 'g2',
      source_url: 'https://www.g2.com/products/monday-com',
    },
    {
      name: 'Dropbox',
      description: 'Cloud storage and file sharing',
      website: 'https://dropbox.com',
      category: 'Cloud Storage',
      source: 'g2',
      source_url: 'https://www.g2.com/products/dropbox',
    },
    {
      name: 'Canva',
      description: 'Online design and publishing tool',
      website: 'https://canva.com',
      category: 'Design Software',
      source: 'g2',
      source_url: 'https://www.g2.com/products/canva',
    },
    {
      name: 'Mailchimp',
      description: 'Email marketing platform',
      website: 'https://mailchimp.com',
      category: 'Marketing Automation',
      source: 'g2',
      source_url: 'https://www.g2.com/products/mailchimp',
    },
    {
      name: 'Jira',
      description: 'Issue and project tracking',
      website: 'https://atlassian.com/software/jira',
      category: 'Project Management',
      source: 'g2',
      source_url: 'https://www.g2.com/products/jira',
    },
  ]
}
