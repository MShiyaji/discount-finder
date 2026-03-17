'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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

const DISCOUNT_TYPE_COLORS: Record<string, string> = {
  student: 'bg-blue-100 text-blue-800',
  seasonal: 'bg-orange-100 text-orange-800',
  bundle: 'bg-green-100 text-green-800',
  military: 'bg-red-100 text-red-800',
  senior: 'bg-purple-100 text-purple-800',
  nonprofit: 'bg-pink-100 text-pink-800',
  referral: 'bg-yellow-100 text-yellow-800',
  loyalty: 'bg-indigo-100 text-indigo-800',
  regional: 'bg-cyan-100 text-cyan-800',
  employer: 'bg-teal-100 text-teal-800',
  credit_card: 'bg-amber-100 text-amber-800',
  free_tier: 'bg-emerald-100 text-emerald-800',
}

export function ServicesTable() {
  const [search, setSearch] = useState('')
  const [researchingId, setResearchingId] = useState<string | null>(null)

  const { data, isLoading, mutate } = useSWR<{
    success: boolean
    data: Service[]
    pagination: { total: number }
  }>(`/api/services?search=${encodeURIComponent(search)}&limit=100`, fetcher, {
    keepPreviousData: true,
  })

  const handleResearchService = async (serviceId: string) => {
    setResearchingId(serviceId)
    try {
      await fetch('/api/admin/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      })
      mutate()
    } finally {
      setResearchingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Discounts</TableHead>
                <TableHead>Last Researched</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const services = data?.data || []

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search services..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {services.length === 0 ? (
        <Empty
          title="No services found"
          description={search ? 'Try a different search term' : 'Click "Discover Services" to get started'}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Discounts</TableHead>
                <TableHead>Last Researched</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.website && (
                        <a
                          href={service.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {new URL(service.website).hostname}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.category && (
                      <Badge variant="outline">{service.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.discounts.length > 0 ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {service.discounts.length} discount
                            {service.discounts.length !== 1 ? 's' : ''}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{service.name} - Discounts</DialogTitle>
                            <DialogDescription>
                              All available discounts for this service
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-96">
                            <div className="space-y-4 pr-4">
                              {service.discounts.map((discount) => (
                                <DiscountCard key={discount.id} discount={discount} />
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.last_researched_at ? (
                      <span className="text-sm text-muted-foreground">
                        {new Date(service.last_researched_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <Badge variant="secondary">Not researched</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResearchService(service.id)}
                      disabled={researchingId === service.id}
                    >
                      {researchingId === service.id ? (
                        <>
                          <Spinner className="mr-2 h-3 w-3" />
                          Researching...
                        </>
                      ) : (
                        'Research'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data?.pagination && (
        <p className="text-sm text-muted-foreground">
          Showing {services.length} of {data.pagination.total} services
        </p>
      )}
    </div>
  )
}

function DiscountCard({ discount }: { discount: Discount }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <Badge
            className={DISCOUNT_TYPE_COLORS[discount.discount_type] || 'bg-gray-100 text-gray-800'}
          >
            {discount.discount_type.replace('_', ' ')}
          </Badge>
          {discount.discount_percentage && (
            <span className="ml-2 font-semibold">
              {discount.discount_percentage}% off
            </span>
          )}
          {discount.discount_amount && (
            <span className="ml-2 font-semibold">{discount.discount_amount}</span>
          )}
        </div>
        <Badge variant="outline">
          {discount.confidence_score}% confidence
        </Badge>
      </div>

      <p className="mt-2 text-sm">{discount.description}</p>

      {discount.eligibility_requirements && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground">Eligibility</p>
          <p className="text-sm">{discount.eligibility_requirements}</p>
        </div>
      )}

      {discount.how_to_claim && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground">How to Claim</p>
          <p className="text-sm">{discount.how_to_claim}</p>
        </div>
      )}

      {(discount.valid_from || discount.valid_until) && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground">Validity</p>
          <p className="text-sm">
            {discount.valid_from && `From ${discount.valid_from}`}
            {discount.valid_from && discount.valid_until && ' - '}
            {discount.valid_until && `Until ${discount.valid_until}`}
          </p>
        </div>
      )}

      {discount.source_url && (
        <a
          href={discount.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-blue-600 hover:underline"
        >
          View source
        </a>
      )}
    </div>
  )
}
