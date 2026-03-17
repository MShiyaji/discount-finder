import type { DiscoveredService, ScraperResult } from './types'

const POPULAR_APPS = [
  'spotify',
  'netflix',
  'adobe-photoshop',
  'microsoft-office',
  'google-workspace',
  'trello',
  'evernote',
  'lastpass',
  'grammarly',
  '1password',
]

/**
 * Scrapes AlternativeTo for popular applications and their alternatives
 */
export async function scrapeAlternativeTo(
  limit: number = 50
): Promise<ScraperResult> {
  const services: DiscoveredService[] = []
  const errors: string[] = []

  try {
    for (const app of POPULAR_APPS) {
      try {
        const response = await fetch(
          `https://alternativeto.net/software/${app}/`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; DiscountFinder/1.0; +https://example.com)',
              Accept: 'text/html',
            },
          }
        )

        if (!response.ok) {
          errors.push(`AlternativeTo ${app}: HTTP ${response.status}`)
          continue
        }

        const html = await response.text()

        // Extract the main app info
        const nameMatch = html.match(/<h1[^>]*>([^<]+)</i)
        const descMatch = html.match(
          /class="app-description"[^>]*>([^<]+)</i
        )

        if (nameMatch) {
          const name = nameMatch[1].trim()
          if (!services.some((s) => s.name === name)) {
            services.push({
              name,
              description: descMatch ? descMatch[1].trim() : null,
              website: null,
              category: getCategoryFromApp(app),
              source: 'alternativeto',
              source_url: `https://alternativeto.net/software/${app}/`,
            })
          }
        }

        // Extract alternatives listed on the page
        const altMatches = html.matchAll(
          /class="app-card"[^>]*>[\s\S]*?<h2[^>]*>([^<]+)</g
        )
        for (const match of [...altMatches].slice(0, 5)) {
          const altName = match[1].trim()
          if (altName && !services.some((s) => s.name === altName)) {
            services.push({
              name: altName,
              description: null,
              website: null,
              category: getCategoryFromApp(app),
              source: 'alternativeto',
              source_url: `https://alternativeto.net/software/${app}/`,
            })
          }
        }

        if (services.length >= limit) break
      } catch (err) {
        errors.push(
          `AlternativeTo ${app}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }

    // Fallback to curated list
    if (services.length < 10) {
      const fallbackProducts = getFallbackAlternativeToProducts()
      for (const product of fallbackProducts) {
        if (!services.some((s) => s.name === product.name)) {
          services.push(product)
        }
        if (services.length >= limit) break
      }
    }
  } catch (err) {
    errors.push(
      `AlternativeTo general error: ${err instanceof Error ? err.message : 'Unknown error'}`
    )
  }

  return {
    services: services.slice(0, limit),
    errors,
    source: 'alternativeto',
  }
}

function getCategoryFromApp(app: string): string {
  const categoryMap: Record<string, string> = {
    spotify: 'Music Streaming',
    netflix: 'Video Streaming',
    'adobe-photoshop': 'Design Software',
    'microsoft-office': 'Office Suite',
    'google-workspace': 'Productivity',
    trello: 'Project Management',
    evernote: 'Note Taking',
    lastpass: 'Password Manager',
    grammarly: 'Writing Tools',
    '1password': 'Password Manager',
  }
  return categoryMap[app] || 'Software'
}

function getFallbackAlternativeToProducts(): DiscoveredService[] {
  return [
    {
      name: 'Spotify',
      description: 'Music streaming service',
      website: 'https://spotify.com',
      category: 'Music Streaming',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/spotify/',
    },
    {
      name: 'Netflix',
      description: 'Video streaming service',
      website: 'https://netflix.com',
      category: 'Video Streaming',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/netflix/',
    },
    {
      name: 'Adobe Creative Cloud',
      description: 'Creative software suite',
      website: 'https://adobe.com/creativecloud',
      category: 'Design Software',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/adobe-creative-cloud/',
    },
    {
      name: 'Microsoft 365',
      description: 'Productivity suite',
      website: 'https://microsoft.com/microsoft-365',
      category: 'Office Suite',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/microsoft-office/',
    },
    {
      name: 'GitHub',
      description: 'Code hosting and collaboration',
      website: 'https://github.com',
      category: 'Developer Tools',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/github/',
    },
    {
      name: 'Discord',
      description: 'Voice, video, and text communication',
      website: 'https://discord.com',
      category: 'Communication',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/discord/',
    },
    {
      name: 'Bitwarden',
      description: 'Open source password manager',
      website: 'https://bitwarden.com',
      category: 'Password Manager',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/bitwarden/',
    },
    {
      name: 'YouTube Premium',
      description: 'Ad-free YouTube with music',
      website: 'https://youtube.com/premium',
      category: 'Video Streaming',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/youtube/',
    },
    {
      name: 'Obsidian',
      description: 'Knowledge base and note-taking',
      website: 'https://obsidian.md',
      category: 'Note Taking',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/obsidian/',
    },
    {
      name: 'VS Code',
      description: 'Source code editor',
      website: 'https://code.visualstudio.com',
      category: 'Developer Tools',
      source: 'alternativeto',
      source_url: 'https://alternativeto.net/software/visual-studio-code/',
    },
  ]
}
