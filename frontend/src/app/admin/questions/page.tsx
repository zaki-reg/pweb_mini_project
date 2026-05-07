'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { AdminQuestion, Category } from '@/types'
import { PageHeader } from '@/components/ui/page-header'
import { DataTable } from '@/components/ui/data-table'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { QuestionForm } from '@/components/admin/QuestionForm'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { HelpCircle } from 'lucide-react'

interface QuestionsResponse {
  questions: AdminQuestion[]
  total: number
  page: number
  limit: number
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchCategories = useCallback(async () => {
    const { data } = await api.get<Category[]>('/api/admin/categories')
    if (data) setCategories(data)
  }, [])

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
    })
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
    if (difficultyFilter && difficultyFilter !== 'all') params.append('difficulty', difficultyFilter)

    const { data } = await api.get<QuestionsResponse>(`/api/admin/questions?${params}`)
    if (data) {
      setQuestions(data.questions ?? [])
      setTotal(data.total ?? 0)
    }
    setIsLoading(false)
  }, [page, debouncedSearch, typeFilter, difficultyFilter])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    const { error } = await api.delete(`/api/admin/questions/${deleteId}`)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Question deleted')
      fetchQuestions()
    }
    setIsDeleting(false)
    setDeleteId(null)
  }

  const handleFormSuccess = () => {
    setIsFormOpen(false)
    setEditingQuestion(null)
    fetchQuestions()
  }

  const columns = [
    {
      key: 'body',
      header: 'Question',
      render: (item: AdminQuestion) => (
        <div className="max-w-md truncate">{item.body}</div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: AdminQuestion) => (
        <Badge variant={item.type === 'MCQ' ? 'default' : 'secondary'}>
          {item.type}
        </Badge>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (item: AdminQuestion) => {
        const colors = {
          EASY: 'bg-green-100 text-green-800',
          MEDIUM: 'bg-yellow-100 text-yellow-800',
          HARD: 'bg-red-100 text-red-800',
        }
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[item.difficulty]}`}>
            {item.difficulty}
          </span>
        )
      },
    },
    {
      key: 'category',
      header: 'Category',
      render: (item: AdminQuestion) => (
        item.category ? (
          <Badge variant="outline">{item.category.name}</Badge>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: AdminQuestion) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit question"
            onClick={() => {
              setEditingQuestion(item)
              setIsFormOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600"
                aria-label="Delete question"
                onClick={() => setDeleteId(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this question? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Questions"
        action={
          <Button
            onClick={() => {
              setEditingQuestion(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Question
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="SCQ">SCQ</SelectItem>
            <SelectItem value="MCQ">MCQ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonTable columns={5} rows={5} />
      ) : (questions?.length ?? 0) === 0 ? (
        <EmptyState
          icon={HelpCircle}
          message="No questions found. Create your first question to get started."
          actionLabel="Create Question"
          onAction={() => {
            setEditingQuestion(null)
            setIsFormOpen(true)
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={questions}
            keyField="id"
            pageSize={10}
          />
          <div className="text-sm text-slate-500 mt-2">
            Showing {questions.length} of {total} questions
          </div>
        </>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {editingQuestion ? 'Edit Question' : 'New Question'}
          </DialogTitle>
          <QuestionForm
            question={editingQuestion}
            categories={categories}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormOpen(false)
              setEditingQuestion(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}