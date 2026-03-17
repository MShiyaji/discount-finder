'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

interface AdminActionsProps {
  onActionComplete: () => void
}

export function AdminActions({ onActionComplete }: AdminActionsProps) {
  const [discovering, setDiscovering] = useState(false)
  const [researching, setResearching] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<string | null>(null)
  const [researchResult, setResearchResult] = useState<string | null>(null)

  const handleDiscover = async () => {
    setDiscovering(true)
    setDiscoverResult(null)

    try {
      const response = await fetch('/api/admin/discover', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        setDiscoverResult(
          `Discovered ${data.discovered} services. Inserted: ${data.inserted}, Updated: ${data.updated}`
        )
      } else {
        setDiscoverResult(`Error: ${data.error}`)
      }
      onActionComplete()
    } catch (error) {
      setDiscoverResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDiscovering(false)
    }
  }

  const handleResearch = async () => {
    setResearching(true)
    setResearchResult(null)

    try {
      const response = await fetch('/api/admin/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      })
      const data = await response.json()

      if (data.success) {
        if (data.message) {
          setResearchResult(data.message)
        } else {
          setResearchResult(
            `Researched ${data.services_processed} services. Found ${data.discounts_found} discounts.`
          )
        }
      } else {
        setResearchResult(`Error: ${data.error}`)
      }
      onActionComplete()
    } catch (error) {
      setResearchResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setResearching(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Actions</CardTitle>
        <CardDescription>
          Trigger discovery and research manually (cron runs weekly)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-2">
            <Button
              onClick={handleDiscover}
              disabled={discovering}
              className="w-full sm:w-auto"
            >
              {discovering && <Spinner className="mr-2 h-4 w-4" />}
              {discovering ? 'Discovering...' : 'Discover Services'}
            </Button>
            {discoverResult && (
              <p className="text-sm text-muted-foreground">{discoverResult}</p>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <Button
              onClick={handleResearch}
              disabled={researching}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {researching && <Spinner className="mr-2 h-4 w-4" />}
              {researching ? 'Researching...' : 'Research Discounts (5 services)'}
            </Button>
            {researchResult && (
              <p className="text-sm text-muted-foreground">{researchResult}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
