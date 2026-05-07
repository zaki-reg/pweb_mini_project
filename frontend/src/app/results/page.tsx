'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { SubmitResult, QuestionResult } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Toaster, toast } from 'sonner'

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
      }
    }

    if (storedSession) {
      try {
        parsedSession = JSON.parse(storedSession) as QuizSessionData
      } catch {
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
    if (result.score >= 85) return { label: 'Excellent', color: 'text-green-600' }
    if (result.score >= 70) return { label: 'Good', color: 'text-blue-600' }
    if (result.score >= 50) return { label: 'Pass', color: 'text-yellow-600' }
    return { label: 'Try Again', color: 'text-red-600' }
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
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-medium text-black mb-6">Quiz Complete</h1>

          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-black mb-4">
            <span className="text-4xl font-medium text-black">{animatedScore}%</span>
          </div>

          <div className="mb-2">
            <span className={`text-lg font-medium ${gradeBand.color}`}>
              {gradeBand.label}
            </span>
          </div>

          <div className="text-gray-500">
            {result.correctAnswers} / {result.totalQuestions} correct
          </div>
        </div>

        {result.questions && result.questions.length > 0 && session ? (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-black mb-4">Review</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {session.questions.map((question, index) => {
                const questionResult = getQuestionResult(question.id)
                const isCorrect = questionResult?.userAnswers.every((ua) => ua.isCorrect) ?? false

                return (
                  <AccordionItem
                    key={question.id}
                    value={question.id}
                    className="border-2 border-gray-200 rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-gray-400 text-sm">Q{index + 1}</span>
                        <span className="text-black text-sm line-clamp-1 flex-1">
                          {question.body}
                        </span>
                        {isCorrect ? (
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
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

                          let bgClass = 'bg-gray-50'
                          let borderClass = 'border-gray-200'
                          let textClass = 'text-gray-700'

                          if (isCorrectAnswer) {
                            bgClass = 'bg-green-50'
                            borderClass = 'border-green-300'
                            textClass = 'text-green-700'
                          } else if (isUserAnswer && !isCorrectAnswer) {
                            bgClass = 'bg-red-50'
                            borderClass = 'border-red-300'
                            textClass = 'text-red-700'
                          }

                          return (
                            <div
                              key={answer.id}
                              className={`flex items-center gap-2 p-2 rounded border ${bgClass} ${borderClass}`}
                            >
                              <span className={`text-sm ${textClass}`}>{answer.body}</span>
                              {isCorrectAnswer && (
                                <Badge variant="outline" className="ml-auto text-xs border-green-500 text-green-600">
                                  Correct
                                </Badge>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <Badge variant="outline" className="ml-auto text-xs border-red-500 text-red-600">
                                  Your answer
                                </Badge>
                              )}
                            </div>
                          )
                        })}

                        {question.explanation && (
                          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Explanation: </span>
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
          <div className="mb-8 text-center text-gray-500">
            Review not available
          </div>
        )}

        <Button
          onClick={handleTryAgain}
          className="w-full h-11 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Try Again
        </Button>
      </div>

      <Toaster position="top-center" />
    </main>
  )
}

function LoadingState() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">Loading...</p>
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