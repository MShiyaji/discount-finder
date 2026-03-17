'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Discount {
  id: string
  discount_type: string
  description: string
  discount_amount: string | null
  discount_percentage: number | null
  eligibility_requirements: string | null
  how_to_claim: string | null
  valid_from: string | null
  valid_until: string | null
  source_url: string | null
  confidence_score: number
  last_verified_at: string
}

interface Service {
  id: string
  name: string
  description: string | null
  website: string | null
  category: string | null
  source: string
  last_researched_at: string | null
  created_at: string
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

const DISCOUNT_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  student: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/5' },
  seasonal: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', glow: 'shadow-orange-500/5' },
  bundle: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', glow: 'shadow-green-500/5' },
  military: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/5' },
  senior: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/5' },
  nonprofit: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', glow: 'shadow-pink-500/5' },
  referral: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/5' },
  loyalty: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/5' },
  regional: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/5' },
  employer: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400', glow: 'shadow-teal-500/5' },
  credit_card: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/5' },
  free_tier: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
}

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  student: 'Student / Educator',
  seasonal: 'Seasonal Sale',
  bundle: 'Bundle Deal',
  military: 'Military / Veteran',
  senior: 'Senior',
  nonprofit: 'Non-Profit',
  referral: 'Referral Program',
  loyalty: 'Loyalty Reward',
  regional: 'Regional Pricing',
  employer: 'Employer / Corporate',
  credit_card: 'Credit Card Perk',
  free_tier: 'Free Tier Available',
}

// ── Service Detail Page ────────────────────────────────────────────────────────
export default function ServiceDetailPage() {
  const params = useParams()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/services/${params.id}`)
        const json = await res.json()
        if (json.success) {
          setService(json.data)
        } else {
          setError(json.error || 'Service not found')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load service')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.id])

  // Group discounts by type
  const discountsByType: Record<string, Discount[]> = {}
  if (service) {
    for (const d of service.discounts) {
      if (!discountsByType[d.discount_type]) {
        discountsByType[d.discount_type] = []
      }
      discountsByType[d.discount_type].push(d)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Gradient Background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[128px]" />
        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[128px]" />
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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-white/50 transition-colors hover:text-white/80"
            >
              ← Back to Search
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-10">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : service ? (
          <>
            {/* ── Service Header ── */}
            <div className="mb-10">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/60"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="m15 19-7-7 7-7" />
                </svg>
                Back to all services
              </Link>
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-3xl font-bold text-white/80 shadow-lg shadow-purple-500/10">
                  {service.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                    {service.name}
                  </h1>
                  {service.description && (
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/50">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {service.category && (
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/5 text-white/50"
                      >
                        {service.category.replace('_', ' ')}
                      </Badge>
                    )}
                    {service.website && (
                      <a
                        href={service.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-400 transition-colors hover:text-purple-300"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                        {new URL(service.website).hostname}
                      </a>
                    )}
                    {service.discounts.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.discounts.length} way{service.discounts.length !== 1 ? 's' : ''} to save
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Discounts by Type ── */}
            {Object.keys(discountsByType).length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-16 text-center">
                <p className="text-lg text-white/30">
                  No discounts have been discovered for this service yet.
                </p>
                <p className="mt-2 text-sm text-white/20">
                  Check back soon — our system periodically researches new deals.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(discountsByType).map(([type, discounts]) => {
                  const colors = DISCOUNT_TYPE_COLORS[type] || {
                    bg: 'bg-white/5',
                    border: 'border-white/10',
                    text: 'text-white/60',
                    glow: '',
                  }

                  return (
                    <Card
                      key={type}
                      className={`overflow-hidden border ${colors.border} ${colors.bg} shadow-lg ${colors.glow}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="text-xl">
                            {DISCOUNT_TYPE_ICONS[type] || '💰'}
                          </span>
                          <span className={colors.text}>
                            {DISCOUNT_TYPE_LABELS[type] || type.replace('_', ' ')}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {discounts.map((discount) => (
                          <DiscountCard key={discount.id} discount={discount} typeColors={colors} />
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* ── Last Researched ── */}
            {service.last_researched_at && (
              <p className="mt-8 text-center text-xs text-white/20">
                Last researched on{' '}
                {new Date(service.last_researched_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}

// ── Discount Card ──────────────────────────────────────────────────────────────
function DiscountCard({
  discount,
  typeColors,
}: {
  discount: Discount
  typeColors: { bg: string; border: string; text: string; glow: string }
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {discount.discount_percentage != null && (
            <span className={`text-2xl font-extrabold ${typeColors.text}`}>
              {discount.discount_percentage}% off
            </span>
          )}
          {discount.discount_amount && (
            <span className={`text-2xl font-extrabold ${typeColors.text}`}>
              {discount.discount_amount}
            </span>
          )}
        </div>
        <Badge
          variant="outline"
          className="border-white/10 bg-white/5 text-white/40"
        >
          {discount.confidence_score}% confidence
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/60">
        {discount.description}
      </p>

      {discount.eligibility_requirements && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/30">
            Eligibility
          </p>
          <p className="text-sm text-white/50">{discount.eligibility_requirements}</p>
        </div>
      )}

      {discount.how_to_claim && (
        <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/30">
            How to Claim
          </p>
          <p className="text-sm text-white/50">{discount.how_to_claim}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {(discount.valid_from || discount.valid_until) && (
          <div className="flex items-center gap-1.5 text-xs text-white/30">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {discount.valid_from && `From ${new Date(discount.valid_from).toLocaleDateString()}`}
            {discount.valid_from && discount.valid_until && ' — '}
            {discount.valid_until && `Until ${new Date(discount.valid_until).toLocaleDateString()}`}
          </div>
        )}

        {discount.source_url && (
          <a
            href={discount.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-purple-400 transition-colors hover:text-purple-300"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
            View source
          </a>
        )}

        <p className="ml-auto text-xs text-white/20">
          Verified {new Date(discount.last_verified_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 h-4 w-32 bg-white/10" />
      <div className="flex items-start gap-5">
        <Skeleton className="h-16 w-16 shrink-0 rounded-2xl bg-white/10" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-8 w-60 bg-white/10" />
          <Skeleton className="mb-2 h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-3/4 bg-white/5" />
        </div>
      </div>
      <div className="mt-10 space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-white/5 bg-white/[0.03]">
            <CardHeader>
              <Skeleton className="h-6 w-44 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-2/3 bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Error State ────────────────────────────────────────────────────────────────
function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-red-400">Something went wrong</p>
      <p className="mt-2 text-sm text-white/40">{error}</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/60 transition-colors hover:bg-white/10"
      >
        ← Go back home
      </Link>
    </div>
  )
}
