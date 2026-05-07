'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'
import { Admin } from '@/types'

interface AdminAuthContextType {
  admin: Admin | null
  isLoading: boolean
  logout: () => Promise<void>
  refreshAdmin: () => Promise<Admin | null>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = async () => {
    try {
      await api.post('/api/admin/auth/logout')
    } catch {
      // ignore
    }
    setAdmin(null)
  }

  const refreshAdmin = async (): Promise<Admin | null> => {
    setIsLoading(true)
    try {
      const { data } = await api.get<Admin>('/api/admin/auth/me')
      setAdmin(data || null)
      return data || null
    } catch (error) {
      console.error('refreshAdmin error:', error)
      setAdmin(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const check = async () => {
    try {
      const { data } = await api.get<Admin>('/api/admin/auth/me')
      setAdmin(data || null)
    } catch {
      setAdmin(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    check()
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