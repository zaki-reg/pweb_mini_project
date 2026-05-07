'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuizSession } from '@/types'
import { Toaster, toast } from 'sonner'

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (username.length < 2 || username.length > 50) {
      setError('Enter 2-50 characters')
      return
    }

    setIsLoading(true)

    const result = await api.post<QuizSession>('/api/sessions/start', { username })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result.data) {
      sessionStorage.setItem('quizSession', JSON.stringify(result.data))
      router.push(`/quiz?token=${result.data.sessionToken}`)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-xs">
        <h1 className="text-xl font-medium text-center text-black mb-8">Quiz</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="username"
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              if (error) setError('')
            }}
            className="h-10 text-center placeholder:text-center text-black border-gray-300 rounded-md"
            autoComplete="off"
          />
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 text-sm bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Start'}
          </Button>
        </form>
      </div>

      <Toaster position="top-center" />
    </main>
  )
}