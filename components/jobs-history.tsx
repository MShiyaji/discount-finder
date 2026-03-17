'use client'

import useSWR from 'swr'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Job {
  id: string
  job_type: 'discover' | 'research'
  status: 'pending' | 'running' | 'completed' | 'completed_with_errors' | 'failed'
  started_at: string | null
  completed_at: string | null
  services_processed: number
  discounts_found: number
  errors: string[] | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  running: 'default',
  completed: 'outline',
  completed_with_errors: 'destructive',
  failed: 'destructive',
}

export function JobsHistory() {
  const { data, isLoading } = useSWR<{ success: boolean; data: Job[] }>(
    '/api/jobs',
    fetcher
  )

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Discounts</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const jobs = data?.data || []

  if (jobs.length === 0) {
    return (
      <Empty
        title="No jobs yet"
        description="Jobs will appear here after you run discovery or research"
      />
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Discounts</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const duration =
              job.started_at && job.completed_at
                ? Math.round(
                    (new Date(job.completed_at).getTime() -
                      new Date(job.started_at).getTime()) /
                      1000
                  )
                : null

            return (
              <TableRow key={job.id}>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {job.job_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[job.status] || 'secondary'}>
                    {job.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{job.services_processed}</TableCell>
                <TableCell>{job.discounts_found}</TableCell>
                <TableCell>
                  {job.started_at ? (
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.started_at).toLocaleString()}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {duration !== null ? (
                    <span className="text-sm text-muted-foreground">
                      {duration}s
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
