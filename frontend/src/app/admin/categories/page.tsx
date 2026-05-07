'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/page-header'
import { SkeletonTable } from '@/components/ui/skeleton-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Check, X, Plus, FolderOpen } from 'lucide-react'
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
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'

interface CategoryWithCount {
  id: string
  name: string
  slug: string
  _count?: { questions: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchCategories = async () => {
    setIsLoading(true)
    const { data } = await api.get<CategoryWithCount[]>('/api/admin/categories')
    if (data) setCategories(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setIsCreating(true)
    const { error } = await api.post('/api/admin/categories', { name: newCategoryName.trim() })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Category created')
      setNewCategoryName('')
      fetchCategories()
    }
    setIsCreating(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return

    setIsUpdating(id)
    const { error } = await api.put(`/api/admin/categories/${id}`, { name: editName.trim() })

    if (error) {
      toast.error(error)
    } else {
      toast.success('Category updated')
      setEditingId(null)
      fetchCategories()
    }
    setIsUpdating(null)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    const { error } = await api.delete(`/api/admin/categories/${deleteId}`)

    if (error) {
      toast.error(error)
    } else {
      toast.success('Category deleted')
      fetchCategories()
    }
    setIsDeleting(false)
    setDeleteId(null)
  }

  const startEdit = (category: CategoryWithCount) => {
    setEditingId(category.id)
    setEditName(category.name)
  }

  return (
    <div>
      <PageHeader title="Categories" />

      <div className="mb-6">
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            id="category-input"
            placeholder="New category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" disabled={isCreating || !newCategoryName.trim()}>
            {isCreating ? (
              <>
                <Plus className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </>
            )}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <SkeletonTable columns={4} rows={5} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          message="No categories yet. Create your first category to organize questions."
          actionLabel="Create Category"
          onAction={() => {
            document.getElementById('category-input')?.focus()
          }}
        />
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Questions</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {editingId === category.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Save category name"
                          onClick={() => handleUpdate(category.id)}
                          disabled={isUpdating === category.id}
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Cancel edit"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm text-slate-500">{category.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">
                      {category._count?.questions ?? 0} questions
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId !== category.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit category"
                            onClick={() => startEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {category._count?.questions ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cursor-not-allowed opacity-50"
                              title="Cannot delete category with questions"
                              disabled
                              aria-label="Cannot delete category with questions"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600"
                                  aria-label="Delete category"
                                  onClick={() => setDeleteId(category.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{category.name}"? This action cannot be undone.
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
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}