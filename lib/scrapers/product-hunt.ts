import type { DiscoveredService, ScraperResult } from './types'

const CATEGORIES = [
  'artificial-intelligence',
  'developer-tools',
  'productivity',
  'design-tools',
  'marketing',
  'saas',
  'fintech',
  'education',
  'health-fitness',
  'entertainment',
]

interface ProductHuntProduct {
  name: string
  tagline: string
  website: string
  url: string
  topics: { name: string }[]
}

/**
 * Scrapes Product Hunt for popular products using their public pages
 * Note: For production, consider using their official GraphQL API with authentication
 */
export async function scrapeProductHunt(
  limit: number = 50
): Promise<ScraperResult> {
  const services: DiscoveredService[] = []
  const errors: string[] = []

  try {
    // Fetch from Product Hunt's public leaderboard pages
    // We'll scrape the HTML since their API requires OAuth
    for (const category of CATEGORIES.slice(0, 5)) {
      try {
        const response = await fetch(
          `https://www.producthunt.com/topics/${category}`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; DiscountFinder/1.0; +https://example.com)',
              Accept: 'text/html',
            },
          }
        )

        if (!response.ok) {
          errors.push(
            `Product Hunt ${category}: HTTP ${response.status}`
          )
          continue
        }

        const html = await response.text()

        // Extract product data from the HTML using regex patterns
        // Look for product names and websites in the page structure
        const productMatches = html.matchAll(
          /data-test="product-item-name"[^>]*>([^<]+)</g
        )
        const websiteMatches = html.matchAll(
          /href="(https:\/\/www\.producthunt\.com\/products\/[^"]+)"/g
        )

        const productNames = [...productMatches].map((m) => m[1].trim())
        const productUrls = [...websiteMatches].map((m) => m[1])

        for (let i = 0; i < Math.min(productNames.length, 10); i++) {
          const name = productNames[i]
          if (name && !services.some((s) => s.name === name)) {
            services.push({
              name,
              description: null,
              website: null,
              category: formatCategory(category),
              source: 'product_hunt',
              source_url: productUrls[i] || `https://www.producthunt.com/topics/${category}`,
            })
          }
        }

        if (services.length >= limit) break
      } catch (err) {
        errors.push(
          `Product Hunt ${category}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }

    // If scraping didn't work well, fall back to a curated list of popular products
    if (services.length < 10) {
      const fallbackProducts = getFallbackProductHuntProducts()
      for (const product of fallbackProducts) {
        if (!services.some((s) => s.name === product.name)) {
          services.push(product)
        }
        if (services.length >= limit) break
      }
    }
  } catch (err) {
    errors.push(
      `Product Hunt general error: ${err instanceof Error ? err.message : 'Unknown error'}`
    )
  }

  return {
    services: services.slice(0, limit),
    errors,
    source: 'product_hunt',
  }
}

function formatCategory(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Fallback list of popular Product Hunt products for when scraping fails
 */
function getFallbackProductHuntProducts(): DiscoveredService[] {
  return [
    {
      name: 'Notion',
      description: 'All-in-one workspace for notes, docs, and collaboration',
      website: 'https://notion.so',
      category: 'Productivity',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/notion',
    },
    {
      name: 'Figma',
      description: 'Collaborative interface design tool',
      website: 'https://figma.com',
      category: 'Design Tools',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/figma',
    },
    {
      name: 'Linear',
      description: 'Issue tracking and project management',
      website: 'https://linear.app',
      category: 'Developer Tools',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/linear',
    },
    {
      name: 'Vercel',
      description: 'Frontend cloud platform for developers',
      website: 'https://vercel.com',
      category: 'Developer Tools',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/vercel',
    },
    {
      name: 'Raycast',
      description: 'Productivity tool and launcher for Mac',
      website: 'https://raycast.com',
      category: 'Productivity',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/raycast',
    },
    {
      name: 'Midjourney',
      description: 'AI image generation tool',
      website: 'https://midjourney.com',
      category: 'Artificial Intelligence',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/midjourney',
    },
    {
      name: 'ChatGPT',
      description: 'AI chatbot by OpenAI',
      website: 'https://chat.openai.com',
      category: 'Artificial Intelligence',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/chatgpt',
    },
    {
      name: 'Claude',
      description: 'AI assistant by Anthropic',
      website: 'https://claude.ai',
      category: 'Artificial Intelligence',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/claude',
    },
    {
      name: 'Cursor',
      description: 'AI-powered code editor',
      website: 'https://cursor.sh',
      category: 'Developer Tools',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/cursor',
    },
    {
      name: 'Loom',
      description: 'Video messaging for work',
      website: 'https://loom.com',
      category: 'Productivity',
      source: 'product_hunt',
      source_url: 'https://www.producthunt.com/products/loom',
    },
  ]
}
