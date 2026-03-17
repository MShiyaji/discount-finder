'use client'

import { useState } from 'react'
import { ServicesTable } from '@/components/services-table'
import { JobsHistory } from '@/components/jobs-history'
import { AdminActions } from '@/components/admin-actions'
import { StatsOverview } from '@/components/stats-overview'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Discount Finder Admin
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage service discovery and discount research
          </p>
        </header>

        <StatsOverview key={`stats-${refreshKey}`} />

        <div className="mt-8">
          <AdminActions onActionComplete={handleRefresh} />
        </div>

        <Tabs defaultValue="services" className="mt-8">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="jobs">Job History</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <ServicesTable key={`services-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            <JobsHistory key={`jobs-${refreshKey}`} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
