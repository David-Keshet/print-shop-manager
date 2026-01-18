'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InvoicesRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/documents')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-gray-400 font-bold tracking-widest text-xs uppercase animate-pulse">
        מעביר למערכת המסמכים המאוחדת...
      </div>
    </div>
  )
}

