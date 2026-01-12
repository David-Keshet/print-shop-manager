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
        className="fixed top-6 right-6 z-50 p-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all shadow-xl"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white/10 backdrop-blur-lg border-l border-white/20 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Logo */}
        <Link href="/">
          <div className="p-6 border-b border-white/20 cursor-pointer hover:bg-white/5 transition-all">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🖨️</span>
              <span>דפוס קשת</span>
            </h1>
          </div>
        </Link>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/orders">
            <button className={`w-full text-right px-4 py-3 rounded-xl text-white border transition-all flex items-center gap-3 group ${
              isActive('/orders')
                ? 'bg-blue-500/30 border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-xl group-hover:scale-110 transition-transform">📦</span>
              <span>הזמנות</span>
            </button>
          </Link>

          <Link href="/tasks/board">
            <button className={`w-full text-right px-4 py-3 rounded-xl text-white border transition-all flex items-center gap-3 group ${
              isActive('/tasks')
                ? 'bg-blue-500/30 border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-xl group-hover:scale-110 transition-transform">📌</span>
              <span>לוח משימות</span>
            </button>
          </Link>

          <div className="border-t border-white/10 my-3"></div>

          <Link href="/customers">
            <button className={`w-full text-right px-4 py-3 rounded-xl text-white border transition-all flex items-center gap-3 group ${
              isActive('/customers')
                ? 'bg-blue-500/30 border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-xl group-hover:scale-110 transition-transform">👥</span>
              <span>לקוחות</span>
            </button>
          </Link>

          <div className="border-t border-white/10 my-3"></div>

          <Link href="/reports">
            <button className={`w-full text-right px-4 py-3 rounded-xl text-white border transition-all flex items-center gap-3 group ${
              isActive('/reports')
                ? 'bg-blue-500/30 border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
              <span>דוחות</span>
            </button>
          </Link>

          <div className="border-t border-white/10 my-3"></div>

          <Link href="/users">
            <button className={`w-full text-right px-4 py-3 rounded-xl text-white border transition-all flex items-center gap-3 group ${
              isActive('/users')
                ? 'bg-blue-500/30 border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-xl group-hover:scale-110 transition-transform">👨‍💼</span>
              <span>ניהול משתמשים</span>
            </button>
          </Link>

          <Link href="/settings">
            <button className={`w-full text-right px-4 py-3 rounded-xl text-white border transition-all flex items-center gap-3 group ${
              isActive('/settings')
                ? 'bg-blue-500/30 border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
            }`}>
              <span className="text-xl group-hover:scale-110 transition-transform">⚙️</span>
              <span>הגדרות</span>
            </button>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/20">
          <p className="text-xs text-white/50 text-center">© 2026 דפוס קשת</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-[90%] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
