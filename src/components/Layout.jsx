'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Home } from 'lucide-react'
import SyncIndicator from './SyncIndicator'

export default function Layout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sync Status Indicator */}
      <SyncIndicator />

      {/* Toggle Button - פינה ימנית תחתונה */}
      {mounted && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 backdrop-blur-lg rounded-full text-gray-200 transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-110 group"
        >
          <Menu size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Sidebar */}
      {mounted && (
        <aside className={`${sidebarOpen ? 'w-22' : 'w-22'} bg-gray-800/20 backdrop-blur-lg border-l border-gray-700/30 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Menu Items */}
        <nav className="flex-1 p-4 pt-4 overflow-y-auto">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/')
                ? 'bg-indigo-500/30 border-indigo-400/50 shadow-lg'
                : 'bg-gray-800/30 hover:bg-gray-700/40 border-gray-700/30 hover:border-gray-600/40'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">🏠</span>
              {sidebarOpen && <span>דף הבית</span>}
            </button>
          </Link>

          <Link href="/orders" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/orders')
                ? 'bg-blue-500/30 border-blue-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
              {sidebarOpen && <span>הזמנות</span>}
            </button>
          </Link>

          <Link href="/tasks/board" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/tasks')
                ? 'bg-green-500/30 border-green-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📌</span>
              {sidebarOpen && <span>לוח משימות</span>}
            </button>
          </Link>

          <Link href="/customers" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/customers')
                ? 'bg-purple-500/30 border-purple-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
              {sidebarOpen && <span>לקוחות</span>}
            </button>
          </Link>

          <Link href="/invoices" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/invoices')
                ? 'bg-amber-500/30 border-amber-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">🧾</span>
              {sidebarOpen && <span>חשבוניות</span>}
            </button>
          </Link>

          <Link href="/reports" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/reports')
                ? 'bg-orange-500/30 border-orange-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              {sidebarOpen && <span>דוחות</span>}
            </button>
          </Link>

          <Link href="/users" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/users')
                ? 'bg-pink-500/30 border-pink-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">👨‍💼</span>
              {sidebarOpen && <span>ניהול משתמשים</span>}
            </button>
          </Link>

          <Link href="/cache" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium mb-6 ${
              isActive('/cache')
                ? 'bg-teal-500/30 border-teal-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">💾</span>
              {sidebarOpen && <span>Cache</span>}
            </button>
          </Link>

          <Link href="/settings/icount" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full ${sidebarOpen ? 'px-5 py-4' : 'aspect-square'} rounded-xl text-gray-200 border-2 transition-all flex items-center ${sidebarOpen ? 'gap-4' : 'justify-center'} group text-base font-medium ${
              isActive('/settings')
                ? 'bg-gray-500/30 border-gray-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
              {sidebarOpen && <span>הגדרות iCount</span>}
            </button>
          </Link>
        </nav>

        {/* Footer */}
        <div className={`p-6 border-t border-gray-700/30 ${!sidebarOpen && 'justify-center text-center'}`}>
          <p className={`text-sm text-gray-200/60 font-medium ${sidebarOpen ? 'text-center' : 'text-xs'}`}>
            {sidebarOpen ? '© 2026 דפוס קשת' : '©'}
          </p>
        </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  )
}
