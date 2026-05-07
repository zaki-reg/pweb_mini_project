'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Attempt } from '@/types'
import { PageHeader } from '@/components/ui/page-header'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, History } from 'lucide-react'

interface AttemptsResponse {
  attempts: Attempt[]
  total: number
  page: number
  limit: number
}

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const router = useRouter()

  const limit = 10

  const fetchAttempts = async (pageNum: number) => {
    setIsLoading(true)
    const { data } = await api.get<AttemptsResponse>(
      `/api/admin/attempts?page=${pageNum}&limit=${limit}`
    )
    if (data) {
      setAttempts(data.attempts)
      setTotal(data.total)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAttempts(page)
  }, [page])

  const totalPages = Math.ceil(total / limit)

  const columns = [
    {
      key: 'username',
      header: 'Username',
      render: (item: Attempt) => (
        <span className="font-medium">{item.username}</span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Date',
      render: (item: Attempt) => (
        item.submittedAt 
          ? new Date(item.submittedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-'
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (item: Attempt) => (
        item.score !== null ? (
          <Badge variant={item.score >= 70 ? 'default' : item.score >= 50 ? 'secondary' : 'destructive'}>
            {item.score}%
          </Badge>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'correctAnswers',
      header: 'Correct / Total',
      render: (item: Attempt) => (
        item.correctAnswers !== null ? (
          <span className="text-sm">
            {item.correctAnswers} / {item.totalQuestions}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'timeTaken',
      header: 'Time',
      render: (item: Attempt) => (
        item.timeTakenSeconds !== null ? (
          <span className="text-sm text-slate-500">
            {Math.floor(item.timeTakenSeconds / 60)}m {item.timeTakenSeconds % 60}s
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Attempts" />

      {isLoading ? (
        <SkeletonTable columns={5} rows={5} />
      ) : attempts.length === 0 ? (
        <div className="text-center py-12">
          <History className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">No attempts yet</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-left text-sm font-medium text-slate-500"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attempts.map((attempt) => (
                  <tr
                    key={attempt.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/attempts/${attempt.id}`)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(attempt) : String(attempt[col.key as keyof Attempt] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} attempts
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}