'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Home } from 'lucide-react'

export default function Layout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Toggle Button - פינה ימנית תחתונה */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 hover:bg-blue-700 backdrop-blur-lg rounded-full text-gray-200 transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-110 group"
      >
        <Menu size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-gray-800/20 backdrop-blur-lg border-l border-gray-700/30 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Menu Items */}
        <nav className="flex-1 p-6 pt-20 space-y-3 overflow-y-auto">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/')
                ? 'bg-indigo-500/30 border-indigo-400/50 shadow-lg'
                : 'bg-gray-800/30 hover:bg-gray-700/40 border-gray-700/30 hover:border-gray-600/40'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">🏠</span>
              <span>דף הבית</span>
            </button>
          </Link>

          <Link href="/orders" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/orders')
                ? 'bg-blue-500/30 border-blue-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
              <span>הזמנות</span>
            </button>
          </Link>

          <Link href="/tasks/board" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/tasks')
                ? 'bg-green-500/30 border-green-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📌</span>
              <span>לוח משימות</span>
            </button>
          </Link>

          <Link href="/customers" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/customers')
                ? 'bg-purple-500/30 border-purple-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
              <span>לקוחות</span>
            </button>
          </Link>

          <Link href="/reports" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/reports')
                ? 'bg-orange-500/30 border-orange-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              <span>דוחות</span>
            </button>
          </Link>

          <Link href="/users" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/users')
                ? 'bg-pink-500/30 border-pink-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">👨‍💼</span>
              <span>ניהול משתמשים</span>
            </button>
          </Link>

          <Link href="/settings" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-gray-200 border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/settings')
                ? 'bg-gray-500/30 border-gray-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-gray-800/20 border-white/10 hover:border-gray-700/30'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
              <span>הגדרות</span>
            </button>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700/30">
          <p className="text-sm text-gray-200/60 text-center font-medium">© 2026 דפוס קשת</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Home Button - Only show if not on home page */}
        {pathname !== '/' && (
          <Link href="/">
            <button className="fixed top-6 right-6 z-40 p-3 bg-indigo-600 hover:bg-indigo-700 backdrop-blur-lg rounded-full text-white transition-all shadow-xl hover:shadow-indigo-500/50 hover:scale-110 group">
              <Home size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </Link>
        )}
        {children}
      </main>
    </div>
  )
}
