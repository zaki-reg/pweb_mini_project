'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await api.post<{ id: string }>('/api/admin/auth/login', { email, password })

    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    // Full page redirect to ensure cookie is sent
    window.location.href = '/admin/dashboard'
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-xs">
        <h1 className="text-xl font-medium text-center text-black mb-6">Admin</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-sm border-gray-300 rounded-md"
            required
          />
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 text-sm border-gray-300 rounded-md"
            required
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 text-sm bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </main>
  )
}