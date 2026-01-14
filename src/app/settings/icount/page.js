'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Settings, Save, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function ICountSettingsPage() {
  const [cid, setCid] = useState('')
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [useApiKey, setUseApiKey] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // טען הגדרות קיימות
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // נסה לטעון מ-Supabase
      const response = await fetch('/api/settings/icount')
      const data = await response.json()

      if (data.success && data.settings) {
        setCid(data.settings.cid || '')
        setUser(data.settings.user_name || '')
        setPass(data.settings.pass || '')
        setUseApiKey(false)
      } else {
        // אם אין ב-Supabase, נסה localStorage
        const stored = localStorage.getItem('icount_credentials')
        if (stored) {
          const credentials = JSON.parse(stored)
          if (credentials.apiKey) {
            setApiKey(credentials.apiKey)
            setUseApiKey(true)
          } else {
            setCid(credentials.cid || '')
            setUser(credentials.user || '')
            setPass(credentials.pass || '')
            setUseApiKey(false)
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // במקרה של שגיאה, נסה localStorage
      const stored = localStorage.getItem('icount_credentials')
      if (stored) {
        const credentials = JSON.parse(stored)
        if (credentials.apiKey) {
          setApiKey(credentials.apiKey)
          setUseApiKey(true)
        } else {
          setCid(credentials.cid || '')
          setUser(credentials.user || '')
          setPass(credentials.pass || '')
          setUseApiKey(false)
        }
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)

      const credentials = useApiKey
        ? { apiKey, user, pass }
        : { cid, user, pass }

      // שמור ב-localStorage
      localStorage.setItem('icount_credentials', JSON.stringify(credentials))

      // שמור ב-Supabase
      const response = await fetch('/api/settings/icount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'שגיאה בשמירה למסד נתונים')
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving:', error)

      // בדוק אם זו שגיאת טבלה לא קיימת
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        alert('⚠️ נראה שטבלת ההגדרות עדיין לא קיימת.\n\n' +
              'יש להריץ את ה-Migration תחילה:\n' +
              '1. פתח Supabase Dashboard\n' +
              '2. SQL Editor > New Query\n' +
              '3. העתק את התוכן מ- migrations/006_invoices_system.sql\n' +
              '4. הדבק והרץ\n\n' +
              'לאחר מכן תוכל לשמור את ההגדרות.')
      } else {
        alert('שגיאה בשמירת ההגדרות:\n' + error.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      const credentials = useApiKey
        ? { apiKey, user, pass }
        : { cid, user, pass }

      // קרא ל-API endpoint במקום ישירות ל-iCount
      const response = await fetch('/api/icount/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      console.error('Test error:', error)
      setTestResult({
        success: false,
        message: error.message || 'שגיאה בבדיקת חיבור',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Settings size={32} />
              הגדרות iCount
            </h1>
            <p className="text-gray-400 mt-1">
              הגדר את החיבור למערכת iCount להפקת חשבוניות
            </p>
          </div>

          {/* Settings Card */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-6">
            {/* Toggle between API Key and Credentials */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                שיטת חיבור
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setUseApiKey(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    useApiKey
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  מפתח API
                </button>
                <button
                  onClick={() => setUseApiKey(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    !useApiKey
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  שם משתמש וסיסמה
                </button>
              </div>
            </div>

            {/* API Key Mode */}
            {useApiKey ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    מפתח API
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API3E8-C0A80C03-696778F1-827925E762CA71E1"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    מפתח API שקיבלת מ-iCount (מתחיל ב-API...)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    שם משתמש (נדרש גם עם API Key)
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="username@example.com"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    סיסמה (נדרש גם עם API Key)
                  </label>
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Credentials Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    מספר חברה (CID)
                  </label>
                  <input
                    type="text"
                    value={cid}
                    onChange={(e) => setCid(e.target.value)}
                    placeholder="12345"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    שם משתמש
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="username"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    סיסמה
                  </label>
                  <input
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-sm text-blue-200">
              <div className="flex gap-2">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">איך למצוא את פרטי ה-API?</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-300">
                    <li>היכנס לחשבון iCount שלך</li>
                    <li>עבור להגדרות {'>'} API</li>
                    <li>צור מפתח API חדש או העתק את הקיים</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`rounded-lg p-4 flex items-center gap-3 ${
                  testResult.success
                    ? 'bg-green-900/20 border border-green-700 text-green-200'
                    : 'bg-red-900/20 border border-red-700 text-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle size={24} className="flex-shrink-0" />
                ) : (
                  <XCircle size={24} className="flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    {testResult.success ? 'החיבור תקין!' : 'החיבור נכשל'}
                  </p>
                  <p className="text-sm opacity-90">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={handleTest}
                disabled={testing || (!useApiKey && (!cid || !user || !pass)) || (useApiKey && !apiKey)}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    בודק חיבור...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    בדוק חיבור
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={saving || (!useApiKey && (!cid || !user || !pass)) || (useApiKey && !apiKey)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    שומר...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle size={20} />
                    נשמר!
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    שמור הגדרות
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="mt-6 text-center">
            <a
              href="https://api.icount.co.il/api/documentation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm"
            >
              תיעוד API של iCount
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}
