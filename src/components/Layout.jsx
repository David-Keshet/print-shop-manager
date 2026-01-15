'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Home, Package, ClipboardList, Users, FileText, BarChart3, UserCog, Database, Settings } from 'lucide-react'
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

  const menuItems = [
    { path: '/', icon: Home, label: 'דף הבית', color: 'indigo' },
    { path: '/orders', icon: Package, label: 'הזמנות', color: 'blue' },
    { path: '/tasks/board', icon: ClipboardList, label: 'לוח משימות', color: 'green' },
    { path: '/customers', icon: Users, label: 'לקוחות', color: 'purple' },
    { path: '/documents', icon: FileText, label: 'מסמכים', color: 'amber' },
    { path: '/reports', icon: BarChart3, label: 'דוחות', color: 'orange' },
    { path: '/users', icon: UserCog, label: 'ניהול משתמשים', color: 'pink' },
    { path: '/cache', icon: Database, label: 'Cache', color: 'teal' },
    { path: '/settings', icon: Settings, label: 'הגדרות מערכת', color: 'gray' },
  ]

  const handleLinkClick = () => {
    setSidebarOpen(false)
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sync Status Indicator */}
      {mounted && <SyncIndicator />}

      {/* Overlay - appears when sidebar is open */}
      {mounted && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Clean Sidebar */}
      {mounted && (
        <aside 
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 flex flex-col transition-all duration-300 ease-in-out relative z-50`}
        >
          {/* Toggle Button - Only show when closed */}
          {!sidebarOpen && (
            <div className="p-4 flex items-center justify-center border-b border-gray-700/30">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-lg hover:bg-gray-800/50 transition-all text-gray-300 hover:text-white"
                aria-label="Open Sidebar"
              >
                <Menu size={24} />
              </button>
            </div>
          )}

          {/* Menu Items */}
          <nav className={`flex-1 p-4 overflow-y-auto custom-scrollbar space-y-2 ${!sidebarOpen ? 'pt-4' : 'pt-6'}`}>
            {menuItems.map((item) => {
              const active = isActive(item.path)
              const IconComponent = item.icon
              
              return (
                <Link key={item.path} href={item.path} onClick={handleLinkClick}>
                  <button
                    className={`w-full rounded-lg transition-all flex items-center gap-3 group/item relative overflow-hidden
                      ${sidebarOpen ? 'px-4 py-3' : 'p-3 justify-center'}
                      ${active 
                        ? `bg-${item.color}-500/20 hover:bg-${item.color}-500/30 text-white` 
                        : 'bg-gray-800/30 hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
                      }
                    `}
                  >
                    {/* Icon */}
                    <IconComponent size={20} className="flex-shrink-0" />
                    
                    {/* Text Label */}
                    {sidebarOpen && (
                      <span className="font-medium text-sm whitespace-nowrap">
                        {item.label}
                      </span>
                    )}

                    {/* Active Indicator */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full"></div>
                    )}
                  </button>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-700/30 text-center">
              <p className="text-xs text-gray-400">
                © 2026 דפוס קשת
              </p>
            </div>
          )}
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  )
}