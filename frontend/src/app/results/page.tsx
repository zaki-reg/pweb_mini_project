'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { SubmitResult, QuestionResult } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { EyeOff } from 'lucide-react'

interface QuizSessionData {
  sessionToken: string
  username: string
  totalQuestions: number
  questions: Array<{
    id: string
    body: string
    type: 'SCQ' | 'MCQ'
    explanation: string | null
    answers: Array<{ id: string; body: string }>
  }>
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token')

  const [result, setResult] = useState<SubmitResult | null>(null)
  const [session, setSession] = useState<QuizSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (!token) {
      router.push('/')
      return
    }

    const storedResult = sessionStorage.getItem('quizResult')
    const storedSession = sessionStorage.getItem('quizSession')

    let parsedResult: SubmitResult | null = null
    let parsedSession: QuizSessionData | null = null

    if (storedResult) {
      try {
        parsedResult = JSON.parse(storedResult) as SubmitResult
      } catch {
        // Invalid
      }
    }

    if (storedSession) {
      try {
        parsedSession = JSON.parse(storedSession) as QuizSessionData
      } catch {
        // Invalid
      }
    }

    if (parsedResult) {
      setResult(parsedResult)
      if (parsedSession && parsedSession.sessionToken === token) {
        setSession(parsedSession)
      } else {
        fetchSessionData()
      }
    } else {
      fetchResultFromApi()
    }

    async function fetchResultFromApi() {
      const resultApi = await api.get<SubmitResult>(`/api/sessions/${token}`)
      if (resultApi.error) {
        toast.error(resultApi.error)
        router.push('/')
        return
      }
      if (resultApi.data) {
        setResult(resultApi.data)
        fetchSessionData()
      }
    }

    async function fetchSessionData() {
      const sessionApi = await api.get<QuizSessionData>(`/api/sessions/${token}`)
      if (sessionApi.data) {
        setSession(sessionApi.data)
      }
    }
  }, [token, router])

  useEffect(() => {
    if (result) {
      const duration = 1500
      const steps = 60
      const increment = result.score / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= result.score) {
          setAnimatedScore(result.score)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.round(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [result])

  const gradeBand = useMemo(() => {
    if (!result) return { label: '', color: '' }
    if (result.score >= 85) return { label: 'Excellent', color: 'text-emerald-400' }
    if (result.score >= 70) return { label: 'Good', color: 'text-amber-400' }
    if (result.score >= 50) return { label: 'Pass', color: 'text-blue-400' }
    return { label: 'Needs Improvement', color: 'text-rose-400' }
  }, [result])

  const getQuestionResult = (questionId: string): QuestionResult | undefined => {
    return result?.questions?.find((q) => q.questionId === questionId)
  }

  const handleTryAgain = () => {
    sessionStorage.removeItem('quizSession')
    sessionStorage.removeItem('quizResult')
    router.push('/')
  }

  if (!result) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading results...</p>
        </div>
      </main>
    )
  }

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <main className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Quiz Complete!</h1>

          <div className="relative inline-block">
            <svg className="w-32 h-32 sm:w-40 sm:w-48 sm:h-48 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="40"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-slate-800"
              />
              <circle
                cx="64"
                cy="64"
                r="40"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-bold text-white">{animatedScore}%</span>
            </div>
          </div>

          <div className="mt-6">
            <span className={`text-2xl font-semibold ${gradeBand.color}`}>
              {gradeBand.label}
            </span>
          </div>

          <div className="mt-4 text-slate-400 text-lg">
            {result.correctAnswers} out of {result.totalQuestions} correct
          </div>
        </div>

        {result.questions && result.questions.length > 0 && session ? (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-white mb-6">Review Your Answers</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {session.questions.map((question, index) => {
                const questionResult = getQuestionResult(question.id)
                const isCorrect = questionResult?.userAnswers.every((ua) => ua.isCorrect) ?? false

                return (
                  <AccordionItem
                    key={question.id}
                    value={question.id}
                    className="bg-slate-900/80 border-slate-800 rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-slate-400 text-sm">Q{index + 1}</span>
                        <span className="text-slate-200 text-sm line-clamp-2 flex-1">
                          {question.body}
                        </span>
                        {isCorrect ? (
                          <svg
                            className="w-5 h-5 text-emerald-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-rose-400 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {question.answers.map((answer) => {
                          const isUserAnswer = questionResult?.userAnswers.some(
                            (ua) => ua.id === answer.id
                          )
                          const isCorrectAnswer = questionResult?.correctAnswers.some(
                            (ca) => ca.id === answer.id
                          )

                          let bgClass = 'bg-slate-800/50'
                          let borderClass = 'border-slate-700'
                          let textClass = 'text-slate-300'

                          if (isCorrectAnswer) {
                            bgClass = 'bg-emerald-500/10'
                            borderClass = 'border-emerald-500/50'
                            textClass = 'text-emerald-300'
                          } else if (isUserAnswer && !isCorrectAnswer) {
                            bgClass = 'bg-rose-500/10'
                            borderClass = 'border-rose-500/50'
                            textClass = 'text-rose-300'
                          }

                          return (
                            <div
                              key={answer.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border ${bgClass} ${borderClass}`}
                            >
                              {isCorrectAnswer ? (
                                <svg
                                  className="w-4 h-4 text-emerald-400 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : isUserAnswer ? (
                                <svg
                                  className="w-4 h-4 text-rose-400 flex-shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <div className="w-4 h-4" />
                              )}
                              <span className={`text-sm ${textClass}`}>{answer.body}</span>
                              {isCorrectAnswer && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-xs border-emerald-500/50 text-emerald-400"
                                >
                                  Correct
                                </Badge>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <Badge
                                  variant="outline"
                                  className="ml-auto text-xs border-rose-500/50 text-rose-400"
                                >
                                  Your answer
                                </Badge>
                              )}
                            </div>
                          )
                        })}

                        {question.explanation && (
                          <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400">
                              <span className="font-medium text-slate-300">Explanation: </span>
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        ) : (
          <div className="mt-12">
            <EmptyState
              icon={EyeOff}
              message="Review is not available for this quiz. Your score has been recorded."
            />
          </div>
        )}

        <div className="mt-12 text-center">
          <Button
            onClick={handleTryAgain}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-6 text-lg"
          >
            Try Again
          </Button>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </main>
  )
}

function LoadingState() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading results...</p>
      </div>
    </main>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResultsContent />
    </Suspense>
  )
}