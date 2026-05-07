'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { QuizSession } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { Toaster, toast } from 'sonner'

function QuizContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get('token')

  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  useEffect(() => {
    if (!token) {
      router.push('/')
      return
    }

    const stored = sessionStorage.getItem('quizSession')
    let loadedSession: QuizSession | null = null

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as QuizSession
        if (parsed.sessionToken === token) {
          loadedSession = parsed
        }
      } catch {
      }
    }

    if (loadedSession) {
      setSession(loadedSession)
      setIsLoading(false)
    } else {
      loadSessionFromApi()
    }

    async function loadSessionFromApi() {
      const result = await api.get<QuizSession>(`/api/sessions/${token}`)
      if (result.error) {
        toast.error(result.error)
        router.push('/')
        return
      }
      if (result.data) {
        if (result.data.questions.length === 0) {
          toast.error('This quiz has already been submitted')
          router.push('/')
          return
        }
        setSession(result.data)
        setIsLoading(false)
      }
    }
  }, [token, router])

  const currentQuestion = session?.questions[currentIndex]

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((a) => a.length > 0).length
  }, [answers])

  const unansweredCount = session
    ? session.questions.length - answeredCount
    : 0

  const handleAnswerSelect = (questionId: string, answerId: string, isMulti: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (isMulti) {
        if (current.includes(answerId)) {
          return { ...prev, [questionId]: current.filter((id) => id !== answerId) }
        } else {
          return { ...prev, [questionId]: [...current, answerId] }
        }
      } else {
        return { ...prev, [questionId]: [answerId] }
      }
    })
  }

  const isAnswerSelected = (questionId: string, answerId: string) => {
    return answers[questionId]?.includes(answerId) || false
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (session && currentIndex < session.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!token || !session) return

    setIsSubmitting(true)

    const formattedAnswers = session.questions.map((q) => ({
      questionId: q.id,
      answerIds: answers[q.id] || [],
    }))

    const result = await api.post<{ score: number; correctAnswers: number; totalQuestions: number; questions?: unknown[] }>(
      `/api/sessions/${token}/submit`,
      { answers: formattedAnswers }
    )

    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
      return
    }

    if (result.data) {
      sessionStorage.setItem('quizResult', JSON.stringify(result.data))
      router.push(`/results?token=${token}`)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </main>
    )
  }

  if (!session || !currentQuestion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Invalid session</p>
      </main>
    )
  }

  const progress = ((currentIndex + 1) / session.questions.length) * 100

  return (
    <main className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              {currentIndex + 1} / {session.questions.length}
            </span>
            <Badge variant="outline" className="text-xs">
              {currentQuestion.type}
            </Badge>
          </div>
          <Progress value={progress} className="h-1 bg-gray-200" />
          <div className="flex gap-1 mt-3 flex-wrap">
            {session.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-full text-xs transition-all ${
                  idx === currentIndex
                    ? 'bg-black text-white'
                    : answers[q.id]?.length
                    ? 'bg-gray-200 text-black'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <Card className="border-2 border-black rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg text-black leading-relaxed">
              {currentQuestion.body}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === 'SCQ' ? (
              <RadioGroup
                value={answers[currentQuestion.id]?.[0] || ''}
                onValueChange={(value) =>
                  handleAnswerSelect(currentQuestion.id, value, false)
                }
                className="space-y-2"
                aria-label="Answer options"
              >
                {currentQuestion.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      answers[currentQuestion.id]?.[0] === answer.id
                        ? 'border-black bg-gray-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, answer.id, false)}
                  >
                    <RadioGroupItem
                      value={answer.id}
                      id={answer.id}
                      className="border-black"
                    />
                    <Label
                      htmlFor={answer.id}
                      className="text-black cursor-pointer flex-1 text-sm"
                    >
                      {answer.body}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-2" role="group" aria-label="Answer options">
                {currentQuestion.answers.map((answer) => {
                  const isSelected = isAnswerSelected(currentQuestion.id, answer.id)
                  return (
                    <div
                      key={answer.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-black bg-gray-100'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAnswerSelect(currentQuestion.id, answer.id, true)}
                    >
                      <Checkbox
                        id={answer.id}
                        checked={isSelected}
                        className="border-black"
                        onCheckedChange={() =>
                          handleAnswerSelect(currentQuestion.id, answer.id, true)
                        }
                      />
                      <Label
                        htmlFor={answer.id}
                        className="text-black cursor-pointer flex-1 text-sm"
                      >
                        {answer.body}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 h-11 border-2 border-black text-black rounded-lg hover:bg-gray-100"
          >
            Previous
          </Button>

          {currentIndex === session.questions.length - 1 ? (
            <Button
              onClick={() => setShowSubmitDialog(true)}
              className="flex-1 h-11 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Submit
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 h-11 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Next
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="border-2 border-black rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {unansweredCount > 0 ? (
                <span>
                  You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                </span>
              ) : (
                <span>Ready to submit?</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black rounded-lg">Review</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="bg-black text-white rounded-lg hover:bg-gray-800"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

export default function QuizPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <QuizContent />
    </Suspense>
  )
}