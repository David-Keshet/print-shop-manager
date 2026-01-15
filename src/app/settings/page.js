'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Settings as SettingsIcon,
  Database,
  User,
  MessageSquare,
  Save,
  CheckCircle,
  RefreshCw,
  Building,
  Phone,
  Mail,
  Key,
  Zap,
  AlertCircle,
  XCircle,
  Link2,
  Lock,
  FileText
} from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // General & Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    company_name: '',
    company_phone: '',
    company_email: ''
  })

  // WhatsApp Templates
  const [whatsappTemplates, setWhatsappTemplates] = useState({
    whatsapp_new_order: '',
    whatsapp_order_ready: '',
    whatsapp_payment_reminder: '',
    whatsapp_general_update: 'שלום {customer_name}, עדכון לגבי הזמנה מספר {order_number}: {message}'
  })

  // iCount Credentials
  const [icountSettings, setIcountSettings] = useState({
    cid: '',
    user: '',
    pass: '',
    apiKey: '',
    useApiKey: true
  })

  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [openInvoicesCount, setOpenInvoicesCount] = useState(null)
  const [fetchingCount, setFetchingCount] = useState(false)

  const fetchOpenCount = async () => {
    setFetchingCount(true)
    try {
      const response = await fetch('/api/icount/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'open_count' })
      })
      const data = await response.json()
      if (data.success) {
        setOpenInvoicesCount(data.count)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Error fetching open count:', error)
      alert('נכשל במשיכת מספר החשבוניות : ' + error.message)
    } finally {
      setFetchingCount(false)
    }
  }

  useEffect(() => {
    fetchEverything()
  }, [])

  const fetchEverything = async () => {
    setLoading(true)
    try {
      // 1. Fetch General Settings
      const { data: generalData, error: generalError } = await supabase
        .from('settings')
        .select('*')

      if (generalError) throw generalError

      const generalObj = {}
      generalData.forEach(setting => {
        generalObj[setting.key] = setting.value
      })

      setProfileSettings({
        company_name: generalObj.company_name || '',
        company_phone: generalObj.company_phone || '',
        company_email: generalObj.company_email || ''
      })

      setWhatsappTemplates({
        whatsapp_new_order: generalObj.whatsapp_new_order || '',
        whatsapp_order_ready: generalObj.whatsapp_order_ready || '',
        whatsapp_payment_reminder: generalObj.whatsapp_payment_reminder || '',
        whatsapp_general_update: generalObj.whatsapp_general_update || 'שלום {customer_name}, עדכון לגבי הזמנה מספר {order_number}: {message}'
      })

      // 2. Fetch iCount Settings
      const icountResponse = await fetch('/api/settings/icount')
      const icountData = await icountResponse.json()

      if (icountData.success && icountData.settings) {
        setIcountSettings({
          cid: icountData.settings.cid || '',
          user: icountData.settings.user_name || '',
          pass: icountData.settings.pass || '',
          apiKey: '', // Don't expose API key from server if possible, but the route might not support separate modes yet
          useApiKey: false // Default to credentials if they exist
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setSaved(false)
    try {
      // 1. Save Profile & WhatsApp to 'settings' table
      const toSave = { ...profileSettings, ...whatsappTemplates }
      for (const [key, value] of Object.entries(toSave)) {
        await supabase.from('settings').upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' })
      }

      // 2. Save iCount Settings if in Connection tab or if modified
      if (icountSettings.user && icountSettings.pass) {
        await fetch('/api/settings/icount', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cid: icountSettings.cid,
            user: icountSettings.user,
            pass: icountSettings.pass,
            apiKey: icountSettings.apiKey
          })
        })
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('שגיאה בשמירת ההגדרות')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/icount/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cid: icountSettings.cid,
          user: icountSettings.user,
          pass: icountSettings.pass,
          apiKey: icountSettings.apiKey
        })
      })
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: 'שגיאה בחיבור לשרת' })
    } finally {
      setTestingConnection(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'פרופיל עסק', icon: Building },
    { id: 'whatsapp', label: 'הגדרות WhatsApp', icon: MessageSquare },
    { id: 'connection', label: 'חיבור למערכות', icon: Zap },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-blue-500" size={48} />
            <p className="text-blue-200 font-medium">טוען הגדרות...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0f172a] p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3">
                <SettingsIcon size={40} className="text-blue-500" />
                מרכז הגדרות
              </h1>
              <p className="text-gray-400 mt-2 font-medium">
                ניהול העסק, הודעות אוטומטיות וחיבור למערכות חיצוניות
              </p>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
              {saving ? 'שומר כעת...' : saved ? 'נשמר בהצלחה!' : 'שמור הכל'}
            </button>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                >
                  <tab.icon size={22} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-blue-500/20 rounded-2xl">
                        <Building className="text-blue-400" size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-white">פרטי החברה</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 mr-2 flex items-center gap-2">
                          <Building size={14} /> שם העסק
                        </label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={profileSettings.company_name}
                          onChange={(e) => setProfileSettings({ ...profileSettings, company_name: e.target.value })}
                          placeholder="דפוס קשת"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 mr-2 flex items-center gap-2">
                          <Phone size={14} /> טלפון ליצירת קשר
                        </label>
                        <input
                          type="tel"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={profileSettings.company_phone}
                          onChange={(e) => setProfileSettings({ ...profileSettings, company_phone: e.target.value })}
                          placeholder="03-1234567"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-gray-400 mr-2 flex items-center gap-2">
                          <Mail size={14} /> אימייל למשלוח הודעות
                        </label>
                        <input
                          type="email"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={profileSettings.company_email}
                          onChange={(e) => setProfileSettings({ ...profileSettings, company_email: e.target.value })}
                          placeholder="office@print.co.il"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Settings */}
                {activeTab === 'whatsapp' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 rounded-2xl">
                          <MessageSquare className="text-green-400" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">בניית תבניות WhatsApp</h2>
                      </div>
                      <span className="bg-green-500/10 text-green-400 text-xs font-black px-3 py-1 rounded-full border border-green-500/20">
                        ACTIVE
                      </span>
                    </div>

                    <div className="space-y-6">
                      {/* Template 1 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <Zap size={14} className="text-yellow-500" /> הזמנה חדשה
                          </label>
                          <span className="text-[10px] text-gray-500">נשלח עם פתיחת הזמנה</span>
                        </div>
                        <div className="relative">
                          <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all min-h-[100px] leading-relaxed"
                            value={whatsappTemplates.whatsapp_new_order}
                            onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_new_order: e.target.value })}
                            placeholder="שלום {customer_name}, נפתחה עבורך הזמנה מספר {order_number}..."
                          />
                        </div>
                      </div>

                      {/* Template 2 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <CheckCircle size={14} className="text-green-500" /> הזמנה מוכנה
                          </label>
                          <span className="text-[10px] text-gray-500">נשלח כשהסטטוס משתנה ל"מוכן"</span>
                        </div>
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all min-h-[100px] leading-relaxed"
                          value={whatsappTemplates.whatsapp_order_ready}
                          onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_order_ready: e.target.value })}
                          placeholder="היי {customer_name}, ההזמנה שלך מוכנה לאיסוף!"
                        />
                      </div>

                      {/* Template 3 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <Link2 size={14} className="text-blue-500" /> בקשת תשלום
                          </label>
                          <span className="text-[10px] text-gray-500">נשלח עם קישור לתשלום</span>
                        </div>
                        <textarea
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all min-h-[100px] leading-relaxed"
                          value={whatsappTemplates.whatsapp_payment_reminder}
                          onChange={(e) => setWhatsappTemplates({ ...whatsappTemplates, whatsapp_payment_reminder: e.target.value })}
                          placeholder="שלום {customer_name}, נא להסדיר תשלום..."
                        />
                      </div>

                      {/* Variables Info */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4">
                        <AlertCircle className="text-blue-400 shrink-0" size={20} />
                        <div>
                          <p className="text-xs text-blue-200 font-bold mb-2">משתנים זמינים לשימוש:</p>
                          <div className="flex flex-wrap gap-2">
                            {['{customer_name}', '{order_number}', '{message}', '{total_price}'].map(tag => (
                              <code key={tag} className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                                {tag}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Settings */}
                {activeTab === 'connection' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-2xl">
                        <Zap className="text-purple-400" size={24} />
                      </div>
                      <h2 className="text-2xl font-bold text-white">חיבור ל-iCount</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10">
                        <button
                          onClick={() => setIcountSettings({ ...icountSettings, useApiKey: true })}
                          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${icountSettings.useApiKey ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                          מפתח API (מומלץ)
                        </button>
                        <button
                          onClick={() => setIcountSettings({ ...icountSettings, useApiKey: false })}
                          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${!icountSettings.useApiKey ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                          שם משתמש וסיסמה
                        </button>
                      </div>

                      {!icountSettings.useApiKey && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-400 mr-2">מספר חברה (CID)</label>
                          <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={icountSettings.cid}
                            onChange={(e) => setIcountSettings({ ...icountSettings, cid: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 mr-2">שם משתמש</label>
                        <input
                          type="text"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          value={icountSettings.user}
                          onChange={(e) => setIcountSettings({ ...icountSettings, user: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 mr-2">
                          {icountSettings.useApiKey ? 'מפתח API' : 'סיסמה'}
                        </label>
                        <div className="relative">
                          <input
                            type={icountSettings.useApiKey ? 'text' : 'password'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            value={icountSettings.useApiKey ? icountSettings.apiKey : icountSettings.pass}
                            onChange={(e) => icountSettings.useApiKey
                              ? setIcountSettings({ ...icountSettings, apiKey: e.target.value })
                              : setIcountSettings({ ...icountSettings, pass: e.target.value })
                            }
                          />
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2 flex flex-col gap-3 pt-4 border-t border-gray-700">
                        <div className="flex gap-3">
                          <button
                            onClick={testConnection}
                            disabled={testingConnection}
                            className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
                          >
                            {testingConnection ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
                            בדיקת חיבור
                          </button>
                        </div>

                        {/* Open Invoices Count Section */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <DollarSign className="text-yellow-400" size={20} />
                              </div>
                              <h3 className="font-bold text-white">סיכום חובות (חשבוניות פתוחות)</h3>
                            </div>
                            <button
                              onClick={fetchOpenCount}
                              disabled={fetchingCount}
                              className="p-2 hover:bg-white/10 rounded-lg transition-all text-gray-400 hover:text-white"
                              title="רענן נתונים מ-iCount"
                            >
                              <RefreshCw className={fetchingCount ? 'animate-spin' : ''} size={18} />
                            </button>
                          </div>

                          <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-white">
                              {openInvoicesCount !== null ? openInvoicesCount : '—'}
                            </span>
                            <span className="text-gray-400 mb-1 font-bold">חשבוניות פתוחות לתשלום</span>
                          </div>

                          <p className="text-[10px] text-gray-500 italic">
                            * הנתונים נמשכים ישירות מ-iCount ומייצגים מסמכי 'חשבונית מס קבלה' שלא סומנו כשולמו.
                          </p>
                        </div>
                        <button
                          onClick={handleSaveAll}
                          disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                        >
                          {saving ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                          {saving ? 'שומר...' : 'שמור הגדרות'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                          onClick={async () => {
                            try {
                              setSaving(true)
                              const response = await fetch('/api/icount/sync', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'all' })
                              })
                              const data = await response.json()
                              if (data.success) alert('הסנכרון הושלם בהצלחה!')
                              else alert('שגיאה בסנכרון: ' + data.message)
                            } catch (e) {
                              alert('שגיאה בסנכרון')
                            } finally {
                              setSaving(false)
                            }
                          }}
                          className="flex items-center justify-center gap-2 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 text-green-200 px-6 py-4 rounded-2xl font-bold transition-all"
                        >
                          <RefreshCw size={18} />
                          סנכרן נתונים כעת
                        </button>

                        <Link href="/invoices/icount" className="flex-1">
                          <button className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-200 px-6 py-4 rounded-2xl font-bold transition-all h-full">
                            <FileText size={18} />
                            צפה בחשבוניות ב-iCount
                          </button>
                        </Link>
                      </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                      <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 border ${testResult.success ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-red-500/10 border-red-500/20 text-red-200'
                        }`}>
                        {testResult.success ? <CheckCircle className="shrink-0" /> : <XCircle className="shrink-0" />}
                        <p className="text-sm font-bold">{testResult.message}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
