'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Stats {
  totalServices: number
  totalDiscounts: number
  servicesWithDiscounts: number
  needsResearch: number
}

export function StatsOverview() {
  const { data: servicesData, isLoading: servicesLoading } = useSWR(
    '/api/services?limit=1000',
    fetcher
  )

  const stats: Stats = {
    totalServices: servicesData?.pagination?.total || 0,
    totalDiscounts: 0,
    servicesWithDiscounts: 0,
    needsResearch: 0,
  }

  if (servicesData?.data) {
    for (const service of servicesData.data) {
      const discountCount = service.discounts?.length || 0
      stats.totalDiscounts += discountCount
      if (discountCount > 0) {
        stats.servicesWithDiscounts++
      }
      if (!service.last_researched_at) {
        stats.needsResearch++
      }
    }
  }

  if (servicesLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalServices}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Discounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.totalDiscounts}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Services with Discounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.servicesWithDiscounts}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Needs Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.needsResearch}</p>
        </CardContent>
      </Card>
    </div>
  )
}
