'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Layout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 right-6 z-50 p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all shadow-xl"
      >
        <Menu size={22} />
      </button>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} bg-white/10 backdrop-blur-lg border-l border-white/20 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Menu Items */}
        <nav className="flex-1 p-6 pt-20 space-y-5 overflow-y-auto">
          <Link href="/orders" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-white border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/orders')
                ? 'bg-blue-500/30 border-blue-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
              <span>הזמנות</span>
            </button>
          </Link>

          <Link href="/tasks/board" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-white border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/tasks')
                ? 'bg-green-500/30 border-green-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📌</span>
              <span>לוח משימות</span>
            </button>
          </Link>

          <Link href="/customers" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-white border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/customers')
                ? 'bg-purple-500/30 border-purple-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
              <span>לקוחות</span>
            </button>
          </Link>

          <Link href="/reports" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-white border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/reports')
                ? 'bg-orange-500/30 border-orange-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
              <span>דוחות</span>
            </button>
          </Link>

          <Link href="/users" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-white border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/users')
                ? 'bg-pink-500/30 border-pink-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">👨‍💼</span>
              <span>ניהול משתמשים</span>
            </button>
          </Link>

          <Link href="/settings" onClick={() => setSidebarOpen(false)}>
            <button className={`w-full text-right px-5 py-4 rounded-xl text-white border-2 transition-all flex items-center gap-4 group text-base font-medium ${
              isActive('/settings')
                ? 'bg-gray-500/30 border-gray-400/50 shadow-lg'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
              <span>הגדרות</span>
            </button>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <p className="text-sm text-white/60 text-center font-medium">© 2026 דפוס קשת</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-[95%] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
