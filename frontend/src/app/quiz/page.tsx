'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { QuizSession, Question } from '@/types'
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
        // Invalid stored data
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
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">Loading quiz...</p>
        </div>
      </main>
    )
  }

  if (!session || !currentQuestion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <p className="text-slate-400">Invalid quiz session</p>
      </main>
    )
  }

  const progress = ((currentIndex + 1) / session.questions.length) * 100

  return (
    <main className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">
                Question {currentIndex + 1} of {session.questions.length}
              </span>
              <Badge
                variant={currentQuestion.type === 'SCQ' ? 'default' : 'secondary'}
                className={currentQuestion.type === 'SCQ' 
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}
              >
                {currentQuestion.type === 'SCQ' ? 'Single Choice' : 'Multiple Choice'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="text-emerald-400">{answeredCount} answered</span>
              {unansweredCount > 0 && (
                <span className="text-rose-400">• {unansweredCount} left</span>
              )}
            </div>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
          <div className="flex gap-2 mt-4 flex-wrap">
            {session.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  idx === currentIndex
                    ? 'bg-amber-500 text-white'
                    : answers[q.id]?.length
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl text-white leading-relaxed">
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
                className="space-y-3"
              >
                {currentQuestion.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                      answers[currentQuestion.id]?.[0] === answer.id
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, answer.id, false)}
                  >
                    <RadioGroupItem
                      value={answer.id}
                      id={answer.id}
                      className="border-slate-500 text-amber-500"
                    />
                    <Label
                      htmlFor={answer.id}
                      className="text-slate-200 cursor-pointer flex-1"
                    >
                      {answer.body}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="space-y-3">
                {currentQuestion.answers.map((answer) => {
                  const isSelected = isAnswerSelected(currentQuestion.id, answer.id)
                  return (
                    <div
                      key={answer.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-500/10 border-purple-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => handleAnswerSelect(currentQuestion.id, answer.id, true)}
                    >
                      <Checkbox
                        id={answer.id}
                        checked={isSelected}
                        className="border-slate-500 text-purple-500"
                        onCheckedChange={() =>
                          handleAnswerSelect(currentQuestion.id, answer.id, true)
                        }
                      />
                      <Label
                        htmlFor={answer.id}
                        className="text-slate-200 cursor-pointer flex-1"
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

        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Previous
          </Button>

          {currentIndex === session.questions.length - 1 ? (
            <Button
              onClick={() => setShowSubmitDialog(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              Next
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {unansweredCount > 0 ? (
                <span>
                  You have{' '}
                  <span className="text-amber-400 font-semibold">
                    {unansweredCount} unanswered question
                    {unansweredCount > 1 ? 's' : ''}
                  </span>
                  . You can still submit, but unanswered questions will be marked as incorrect.
                </span>
              ) : (
                <span>
                  You have answered all {session.questions.length} questions. Ready to submit?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Review Answers
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="top-center" richColors />
    </main>
  )
}

function LoadingState() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading quiz...</p>
      </div>
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