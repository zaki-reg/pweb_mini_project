'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
      setError('Username must be between 2 and 50 characters')
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
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-medium text-black mb-2">
            Quiz
          </h1>
          <p className="text-gray-500 text-sm">
            Test your knowledge
          </p>
        </div>

        <Card className="border-2 border-black rounded-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-black"
                >
                  Your Name
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (error) setError('')
                  }}
                  className="border-2 border-black rounded-lg text-black placeholder:text-gray-400 h-11"
                  autoComplete="off"
                />
                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Quiz'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-xs mt-6">
          No account required
        </p>
      </div>

      <Toaster position="top-center" />
    </main>
  )
}