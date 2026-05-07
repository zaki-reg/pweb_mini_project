'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Stats } from '@/types'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { DataTable } from '@/components/ui/data-table'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { HelpCircle, Users, TrendingUp, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { History } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await api.get<Stats>('/api/admin/stats')
      if (data) {
        setStats(data)
      }
      setIsLoading(false)
    }
    fetchStats()
  }, [])

  const columns = [
    {
      key: 'username',
      header: 'Username',
    },
    {
      key: 'score',
      header: 'Score',
      render: (item: { score: number | null }) => (
        item.score !== null ? (
          <Badge variant={item.score >= 70 ? 'default' : 'secondary'}>
            {item.score}%
          </Badge>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'submittedAt',
      header: 'Date',
      render: (item: { submittedAt: string | null }) => (
        item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '-'
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Total Questions"
          value={isLoading ? '-' : stats?.totalQuestions ?? 0}
          icon={HelpCircle}
        />
        <StatCard
          label="Total Attempts"
          value={isLoading ? '-' : stats?.totalAttempts ?? 0}
          icon={Users}
        />
        <StatCard
          label="Average Score"
          value={isLoading ? '-' : stats && stats.averageScore !== null ? `${stats.averageScore.toFixed(1)}%` : '-'}
          icon={TrendingUp}
        />
        <StatCard
          label="Active Sessions"
          value={isLoading ? '-' : (stats?.recentAttempts?.filter(a => !a.submittedAt).length ?? 0)}
          icon={Clock}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Attempts</h2>
        {isLoading ? (
          <SkeletonTable columns={3} rows={5} />
        ) : stats?.recentAttempts && stats.recentAttempts.length > 0 ? (
          <DataTable
            columns={columns}
            data={stats.recentAttempts}
            keyField="id"
            pageSize={5}
          />
        ) : (
          <EmptyState
            icon={History}
            message="No quiz attempts yet. Share the quiz link to get started."
          />
        )}
      </div>
    </div>
  )
}