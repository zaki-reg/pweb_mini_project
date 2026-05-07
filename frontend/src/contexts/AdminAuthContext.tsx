'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'
import { Admin } from '@/types'

interface AdminAuthContextType {
  admin: Admin | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshAdmin: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAdmin = async () => {
    try {
      const { data } = await api.get<Admin>('/api/admin/auth/me')
      if (data) {
        setAdmin(data)
      } else {
        setAdmin(null)
      }
    } catch {
      setAdmin(null)
    }
  }

  const logout = async () => {
    await api.post('/api/admin/auth/logout')
    setAdmin(null)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsLoading(false), 8000)
    refreshAdmin().finally(() => {
      clearTimeout(timeoutId)
      setIsLoading(false)
    })
  }, [])

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, logout, refreshAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}