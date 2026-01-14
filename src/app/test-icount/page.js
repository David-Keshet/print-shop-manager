'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'

export default function TestICountPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/icount/test')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">בדיקת חיבור iCount</h1>

          <button
            onClick={runTest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mb-6 disabled:opacity-50"
          >
            {loading ? 'בודק...' : 'בדוק חיבור'}
          </button>

          {result && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className={`text-lg font-bold mb-4 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? '✓ החיבור הצליח' : '✗ החיבור נכשל'}
              </div>

              <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs text-gray-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
