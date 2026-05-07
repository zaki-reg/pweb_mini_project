'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { AttemptDetail, QuestionResult } from '@/types'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export default function AttemptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttempt = async () => {
      setIsLoading(true)
      const { data, error } = await api.get<AttemptDetail>(`/api/admin/attempts/${params.id}`)
      if (error) {
        setError(error)
      } else if (data) {
        setAttempt(data)
      }
      setIsLoading(false)
    }
    fetchAttempt()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error || 'Attempt not found'}</p>
        <Button variant="link" onClick={() => router.push('/admin/attempts')}>
          Back to Attempts
        </Button>
      </div>
    )
  }

  const getGradeLabel = (score: number) => {
    if (score >= 85) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Pass'
    return 'Needs Improvement'
  }

  const getGradeColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/attempts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Attempts
        </Button>
      </div>

      <PageHeader title={`Attempt by ${attempt.username}`} />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attempt.score ?? 0}%</div>
            <Badge className={`mt-2 ${getGradeColor(attempt.score ?? 0)}`}>
              {getGradeLabel(attempt.score ?? 0)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Correct Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {attempt.correctAnswers ?? 0} / {attempt.totalQuestions}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {attempt.correctAnswers !== null 
                ? ((attempt.correctAnswers / attempt.totalQuestions) * 100).toFixed(0)
                : 0}% accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Time Taken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {attempt.timeTakenSeconds 
                ? `${Math.floor(attempt.timeTakenSeconds / 60)}m ${attempt.timeTakenSeconds % 60}s`
                : '-'
              }
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Submitted {new Date(attempt.submittedAt!).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Question Breakdown</h2>
        {attempt.questions?.map((result, index) => (
          <Card key={result.questionId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">
                    Question {index + 1}
                  </p>
                  <p className="text-sm text-slate-600">{result.questionBody}</p>
                </div>
                {result.userAnswers.some(a => a.isCorrect) ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {result.correctAnswers.map((correct) => {
                  const userSelected = result.userAnswers.some(a => a.id === correct.id)
                  return (
                    <div
                      key={correct.id}
                      className={`p-3 rounded-lg border ${
                        userSelected
                          ? 'bg-green-50 border-green-200'
                          : 'bg-green-50/50 border-green-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {userSelected && <CheckCircle className="h-4 w-4 text-green-500" />}
                        <span className={`text-sm ${userSelected ? 'font-medium' : ''}`}>
                          {correct.body}
                        </span>
                        <Badge variant="outline" className="text-xs ml-auto">Correct</Badge>
                      </div>
                    </div>
                  )
                })}

                {result.userAnswers
                  .filter(ua => !ua.isCorrect)
                  .map((userAnswer) => (
                    <div
                      key={userAnswer.id}
                      className="p-3 rounded-lg border bg-red-50 border-red-200"
                    >
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{userAnswer.body}</span>
                        <Badge variant="outline" className="text-xs ml-auto">Your answer</Badge>
                      </div>
                    </div>
                  ))}
              </div>

              {result.explanation && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700">Explanation:</p>
                  <p className="text-sm text-slate-600 mt-1">{result.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}