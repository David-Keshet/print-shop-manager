'use client'

import { useState } from 'react'

export default function DebugSync() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runDebugSync = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', direction: 'rtl' }}>
      <h1>Debug iCount Sync</h1>
      
      <button 
        onClick={runDebugSync}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'מסנכרן...' : 'הפעל סנכרון דיבאג'}
      </button>

      {result && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <h2>תוצאות:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
