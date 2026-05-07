'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { AdminQuestion, Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Answer {
  id?: string
  body: string
  isCorrect: boolean
}

const questionSchema = z.object({
  body: z.string().min(1, 'Question body is required').max(1000),
  type: z.enum(['SCQ', 'MCQ']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  categoryId: z.string().optional(),
  explanation: z.string().optional(),
}).refine((data) => {
  return data.body.trim().length > 0
}, {
  message: 'Question body is required',
  path: ['body']
})

type QuestionFormData = z.infer<typeof questionSchema>

interface QuestionFormProps {
  question?: AdminQuestion | null
  categories: Category[]
  onSuccess: () => void
  onCancel: () => void
}

export function QuestionForm({ question, categories, onSuccess, onCancel }: QuestionFormProps) {
  const [answers, setAnswers] = useState<Answer[]>(
    question?.answers.map(a => ({ id: a.id, body: a.body, isCorrect: !!a.isCorrect })) || [
      { body: '', isCorrect: false },
      { body: '', isCorrect: false }
    ]
  )
  const [scqCorrectIndex, setScqCorrectIndex] = useState<number>(
    question?.answers.findIndex(a => a.isCorrect) ?? -1
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { dirtyFields }
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      body: question?.body || '',
      type: question?.type || 'SCQ',
      difficulty: question?.difficulty || 'MEDIUM',
      categoryId: question?.categoryId || '',
      explanation: question?.explanation || '',
    }
  })

  const questionType = watch('type')

  useEffect(() => {
    if (questionType === 'SCQ') {
      const correctCount = answers.filter(a => a.isCorrect).length
      if (correctCount > 1) {
        const firstCorrect = answers.findIndex(a => a.isCorrect)
        setAnswers(answers.map((a, i) => ({
          ...a,
          isCorrect: i === firstCorrect
        })))
      }
    }
  }, [questionType])

  const addAnswer = () => {
    if (answers.length < 6) {
      setAnswers([...answers, { body: '', isCorrect: false }])
    }
  }

  const removeAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index))
    }
  }

  const toggleCorrect = (index: number) => {
    if (questionType === 'SCQ') {
      setScqCorrectIndex(index)
      setAnswers(answers.map((a, i) => ({
        ...a,
        isCorrect: i === index
      })))
    } else {
      setAnswers(answers.map((a, i) => ({
        ...a,
        isCorrect: i === index ? !a.isCorrect : a.isCorrect
      })))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!watch('body')?.trim()) {
      newErrors.body = 'Question body is required'
    }

    const filledAnswers = answers.filter(a => a.body.trim())
    if (filledAnswers.length < 2) {
      newErrors.answers = 'At least 2 answers are required'
    }

    const correctCount = answers.filter(a => a.isCorrect).length
    if (questionType === 'SCQ' && correctCount !== 1) {
      newErrors.correct = 'SCQ must have exactly 1 correct answer'
    }
    if (questionType === 'MCQ' && correctCount < 1) {
      newErrors.correct = 'MCQ must have at least 1 correct answer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = async (data: QuestionFormData) => {
    if (!validateForm()) return

    setIsSubmitting(true)

    const payload = {
      ...data,
      categoryId: data.categoryId || null,
      explanation: data.explanation || null,
      answers: answers.filter(a => a.body.trim()).map(a => ({
        body: a.body,
        isCorrect: a.isCorrect
      }))
    }

    const endpoint = question
      ? `/api/admin/questions/${question.id}`
      : '/api/admin/questions'
    const method = question ? 'put' : 'post'

    const { error } = await api[method](endpoint, payload)

    if (error) {
      toast.error(error)
      setIsSubmitting(false)
      return
    }

    toast.success(question ? 'Question updated' : 'Question created')
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="body">Question Body</Label>
        <Textarea
          id="body"
          {...register('body')}
          placeholder="Enter your question..."
          rows={3}
        />
        <div className="flex justify-between text-sm text-slate-500">
          <span>{errors.body && <span className="text-red-500">{errors.body}</span>}</span>
          <span>{watch('body')?.length || 0} / 1000</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Question Type</Label>
        <RadioGroup
          value={questionType}
          onValueChange={(v) => setValue('type', v as 'SCQ' | 'MCQ')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="SCQ" id="scq" />
            <Label htmlFor="scq" className="cursor-pointer">SCQ</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="MCQ" id="mcq" />
            <Label htmlFor="mcq" className="cursor-pointer">MCQ</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={watch('categoryId') || ''}
            onValueChange={(v) => setValue('categoryId', v || '')}
          >
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No category</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={watch('difficulty')}
            onValueChange={(v) => setValue('difficulty', v as 'EASY' | 'MEDIUM' | 'HARD')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation (optional)</Label>
        <Textarea
          id="explanation"
          {...register('explanation')}
          placeholder="Explain the correct answer..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Answers</Label>
        {errors.answers && (
          <p className="text-sm text-red-500">{errors.answers}</p>
        )}
        {errors.correct && (
          <p className="text-sm text-red-500">{errors.correct}</p>
        )}
        <div className="space-y-2">
          {answers.map((answer, index) => (
            <div key={index} className="flex items-center gap-2">
{questionType === 'SCQ' ? (
                <RadioGroupItem
                  value={String(index)}
                  checked={scqCorrectIndex === index}
                  id={`answer-${index}`}
                />
              ) : (
                <Checkbox
                  checked={answer.isCorrect}
                  onCheckedChange={() => toggleCorrect(index)}
                  id={`answer-${index}`}
                />
              )}
              <Input
                value={answer.body}
                onChange={(e) => {
                  const newAnswers = [...answers]
                  newAnswers[index].body = e.target.value
                  setAnswers(newAnswers)
                }}
                placeholder={`Answer ${index + 1}`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove answer ${index + 1}`}
                onClick={() => removeAnswer(index)}
                disabled={answers.length <= 2}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAnswer}
          disabled={answers.length >= 6}
          className="mt-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Answer
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : question ? (
            'Update Question'
          ) : (
            'Create Question'
          )}
        </Button>
      </div>
    </form>
  )
}