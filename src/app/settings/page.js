'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings as SettingsIcon, Database, Users, Bell, Palette, Globe } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Settings() {
  const [settings, setSettings] = useState({
    whatsapp_new_order: '',
    whatsapp_order_ready: '',
    company_name: '',
    company_phone: '',
    company_email: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (error) throw error

      const settingsObj = {}
      data.forEach(setting => {
        settingsObj[setting.key] = setting.value
      })

      setSettings(settingsObj)
    } catch (error) {
      console.error('שגיאה בטעינת הגדרות:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // עדכון כל הגדרה בנפרד
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key)

        if (error) throw error
      }

      alert('ההגדרות נשמרו בהצלחה!')
    } catch (error) {
      console.error('שגיאה בשמירת הגדרות:', error)
      alert('שגיאה בשמירת ההגדרות')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div>
            <div className="text-center py-8">
              <p className="text-gray-600">טוען הגדרות...</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div>

        <div className="card">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <SettingsIcon size={32} />
            הגדרות מערכת
          </h1>

          <div className="space-y-6">
            {/* הגדרות חברה */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                פרטי החברה
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">שם החברה</label>
                  <input
                    type="text"
                    className="input-field"
                    value={settings.company_name}
                    onChange={(e) => updateSetting('company_name', e.target.value)}
                    placeholder="דפוס קשת"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">טלפון</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={settings.company_phone}
                      onChange={(e) => updateSetting('company_phone', e.target.value)}
                      placeholder="03-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">אימייל</label>
                    <input
                      type="email"
                      className="input-field"
                      value={settings.company_email}
                      onChange={(e) => updateSetting('company_email', e.target.value)}
                      placeholder="info@printshop.co.il"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* הגדרות WhatsApp */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                הודעות WhatsApp
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    הודעה להזמנה חדשה
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    value={settings.whatsapp_new_order}
                    onChange={(e) => updateSetting('whatsapp_new_order', e.target.value)}
                    placeholder="שלום {customer_name}, נפתחה עבורך הזמנה מספר {order_number}"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    משתנים זמינים: <code className="bg-gray-100 px-2 py-1 rounded">{'{customer_name}'}</code>, <code className="bg-gray-100 px-2 py-1 rounded">{'{order_number}'}</code>
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    הודעה להזמנה מוכנה
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    value={settings.whatsapp_order_ready}
                    onChange={(e) => updateSetting('whatsapp_order_ready', e.target.value)}
                    placeholder="שלום {customer_name}, הזמנה מספר {order_number} מוכנה לאיסוף!"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    משתנים זמינים: <code className="bg-gray-100 px-2 py-1 rounded">{'{customer_name}'}</code>, <code className="bg-gray-100 px-2 py-1 rounded">{'{order_number}'}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* כפתור שמירה */}
            <div className="pt-4">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {saving ? 'שומר...' : 'שמור הגדרות'}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  )
}
