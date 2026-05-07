'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Loader2 } from 'lucide-react'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!isLoading && !admin && !isLoginPage) {
      router.push('/admin/login')
    }
  }, [admin, isLoading, router, isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="ml-0 lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}