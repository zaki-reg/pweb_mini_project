'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  HelpCircle, 
  FolderOpen, 
  History, 
  Settings, 
  LogOut, 
  Menu,
  X,
  ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/attempts', label: 'Attempts', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout, admin } = useAdminAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-black text-white transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          {!collapsed && (
            <span className="text-base font-semibold">Admin Panel</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-gray-400 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                  ${isActive 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          {!collapsed && (
            <div className="mb-3 px-3 text-xs text-gray-400">
              {admin?.email}
            </div>
          )}
          <button
            onClick={logout}
            className={`
              flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}