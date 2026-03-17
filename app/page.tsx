'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Discount {
  id: string
  discount_type: string
  description: string
  discount_amount: string | null
  discount_percentage: number | null
}

interface Service {
  id: string
  name: string
  description: string | null
  website: string | null
  category: string | null
  discounts: Discount[]
}

// ── Constants ──────────────────────────────────────────────────────────────────
const DISCOUNT_TYPE_ICONS: Record<string, string> = {
  student: '🎓',
  seasonal: '📅',
  bundle: '📦',
  military: '🎖️',
  senior: '👴',
  nonprofit: '💚',
  referral: '🔗',
  loyalty: '⭐',
  regional: '🌍',
  employer: '🏢',
  credit_card: '💳',
  free_tier: '🆓',
}

const DISCOUNT_TYPE_COLORS: Record<string, string> = {
  student: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  seasonal: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  bundle: 'bg-green-500/10 text-green-400 border-green-500/20',
  military: 'bg-red-500/10 text-red-400 border-red-500/20',
  senior: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  nonprofit: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  referral: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  loyalty: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  regional: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  employer: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  credit_card: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  free_tier: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '🎬 Streaming', value: 'streaming' },
  { label: '💻 Developer Tools', value: 'developer_tools' },
  { label: '🤖 AI Services', value: 'ai' },
  { label: '🎨 Design', value: 'design' },
  { label: '📊 Productivity', value: 'productivity' },
  { label: '🎵 Music', value: 'music' },
  { label: '🎮 Gaming', value: 'gaming' },
  { label: '☁️ Cloud', value: 'cloud' },
  { label: '📚 Education', value: 'education' },
]

// ── Home Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [featuredServices, setFeaturedServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<Service[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // ── Fetch featured services on mount ──
  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch('/api/services?limit=50')
        const json = await res.json()
        if (json.success) {
          // Services with the most discounts go first
          const sorted = (json.data as Service[])
            .filter((s) => s.discounts.length > 0)
            .sort((a, b) => b.discounts.length - a.discounts.length)
          setFeaturedServices(sorted.slice(0, 12))
          setServices(json.data)
        }
      } catch (e) {
        console.error('Failed to load services', e)
      } finally {
        setIsLoading(false)
      }
    }
    loadFeatured()
  }, [])

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Search handler with debounce ──
  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (!value.trim()) {
        setSearchResults([])
        setShowDropdown(false)
        return
      }

      setIsSearching(true)
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/services?search=${encodeURIComponent(value)}&limit=8`
          )
          const json = await res.json()
          if (json.success) {
            setSearchResults(json.data)
            setShowDropdown(true)
          }
        } catch (e) {
          console.error('Search failed', e)
        } finally {
          setIsSearching(false)
        }
      }, 300)
    },
    []
  )

  // ── Filter services by category ──
  const displayedServices = category
    ? services.filter(
        (s) => s.category?.toLowerCase() === category.toLowerCase()
      )
    : featuredServices

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Gradient Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[128px]" />
        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[128px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[128px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <span className="text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight">SaveSmart</span>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 px-6 pb-8 pt-20 text-center md:pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500"></span>
            </span>
            Stop overpaying for software
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Find{' '}
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              hidden discounts
            </span>{' '}
            on any service
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/50">
            Student deals, bundle savings, seasonal promotions, and more — discover
            every way to save before you buy.
          </p>

          {/* ── Search Bar ── */}
          <div ref={searchRef} className="relative mx-auto mt-10 max-w-xl">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-emerald-500/50 opacity-50 blur transition-opacity group-focus-within:opacity-100" />
              <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#141420] shadow-2xl">
                <svg
                  className="ml-5 h-5 w-5 shrink-0 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  id="search-input"
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true)
                  }}
                  placeholder="Search for a service (Netflix, Claude, Spotify…)"
                  className="w-full bg-transparent px-4 py-4 text-base text-white placeholder-white/30 outline-none"
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="mr-4 h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-purple-400" />
                )}
              </div>
            </div>

            {/* ── Autocomplete Dropdown ── */}
            {showDropdown && (
              <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
                {searchResults.length === 0 ? (
                  <div className="px-5 py-4 text-center text-sm text-white/40">
                    No services found. Try a different search.
                  </div>
                ) : (
                  <ul>
                    {searchResults.map((service) => (
                      <li key={service.id}>
                        <Link
                          href={`/service/${service.id}`}
                          className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/5"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-lg">
                              {service.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {service.name}
                              </p>
                              {service.category && (
                                <p className="text-xs text-white/40">
                                  {service.category.replace('_', ' ')}
                                </p>
                              )}
                            </div>
                          </div>
                          {service.discounts.length > 0 && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            >
                              {service.discounts.length} deal
                              {service.discounts.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Category Chips ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                category === cat.value
                  ? 'border-purple-500/50 bg-purple-500/20 text-purple-300'
                  : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {category
                ? CATEGORIES.find((c) => c.value === category)?.label.replace(
                    /^[^\s]+\s/,
                    ''
                  )
                : 'Top Deals'}
            </h2>
            <p className="mt-1 text-sm text-white/40">
              {category
                ? 'Services matching this category'
                : 'Services with the most savings opportunities'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-white/5 bg-white/[0.03]">
                <CardContent className="p-5">
                  <Skeleton className="mb-3 h-6 w-40 bg-white/10" />
                  <Skeleton className="mb-2 h-4 w-full bg-white/5" />
                  <Skeleton className="h-4 w-3/4 bg-white/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayedServices.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-lg text-white/30">
              {category
                ? 'No services found in this category yet.'
                : 'No services with discounts found. Run the scraper from the Admin page.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedServices.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`}>
                <Card className="group h-full cursor-pointer overflow-hidden border-white/5 bg-white/[0.03] transition-all hover:border-white/10 hover:bg-white/[0.06]">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-lg font-bold text-white/80">
                          {service.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold leading-tight text-white transition-colors group-hover:text-purple-300">
                            {service.name}
                          </h3>
                          {service.category && (
                            <p className="text-xs text-white/30">
                              {service.category.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {service.description && (
                      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-white/40">
                        {service.description}
                      </p>
                    )}

                    {/* Deal Badges */}
                    {service.discounts.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                        {/* Show unique discount types as mini badges */}
                        {Array.from(
                          new Set(service.discounts.map((d) => d.discount_type))
                        )
                          .slice(0, 4)
                          .map((type) => (
                            <span
                              key={type}
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                                DISCOUNT_TYPE_COLORS[type] ||
                                'bg-white/5 text-white/40 border-white/10'
                              }`}
                            >
                              <span>
                                {DISCOUNT_TYPE_ICONS[type] || '💰'}
                              </span>
                              {type.replace('_', ' ')}
                            </span>
                          ))}
                        {service.discounts.length > 4 && (
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/40">
                            +{service.discounts.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0a0f]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-6">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} SaveSmart
          </p>
        </div>
      </footer>
    </div>
  )
}
