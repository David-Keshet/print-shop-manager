'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or('archived.is.null,archived.eq.false')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('שגיאה בטעינת לקוחות:', error)
    } finally {
      setLoading(false)
    }
  }

  const archiveCustomer = async (customerId, customerName) => {
    if (!confirm(`האם אתה בטוח שברצונך לארכב את הלקוח "${customerName}"?\n\nשים לב: הלקוח יועבר לארכיון ולא יוצג ברשימה.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({ archived: true })
        .eq('id', customerId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      alert('הלקוח הועבר לארכיון בהצלחה')
      await fetchCustomers()
    } catch (error) {
      console.error('שגיאה בארכוב לקוח:', error)
      alert(`שגיאה בארכוב הלקוח: ${error.message || 'שגיאה לא ידועה'}`)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.includes(searchTerm))
  )

  if (showNewCustomer) {
    return (
      <Layout>
        <NewCustomerForm onClose={() => { setShowNewCustomer(false); fetchCustomers(); }} />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div>

        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span>👥</span>
              לקוחות
            </h1>
            <button
              onClick={() => setShowNewCustomer(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              לקוח חדש
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חפש לפי שם, טלפון או אימייל..."
                className="input-field pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">טוען לקוחות...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'לא נמצאו לקוחות' : 'אין לקוחות במערכת'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowNewCustomer(true)}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  הוסף לקוח ראשון
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-right font-bold">שם</th>
                    <th className="px-4 py-3 text-right font-bold">טלפון</th>
                    <th className="px-4 py-3 text-right font-bold">אימייל</th>
                    <th className="px-4 py-3 text-right font-bold">כתובת</th>
                    <th className="px-4 py-3 text-right font-bold">תאריך הצטרפות</th>
                    <th className="px-4 py-3 text-center font-bold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold">{customer.name}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.address || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            title="ערוך לקוח"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => archiveCustomer(customer.id, customer.name)}
                            className="text-orange-600 hover:text-orange-800"
                            title="העבר לארכיון"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
    </Layout>
  )
}

function NewCustomerForm({ onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const saveCustomer = async () => {
    if (!name || !phone) {
      alert('אנא מלא שם וטלפון')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('customers')
        .insert([{ name, phone, email, address, notes }])

      if (error) throw error

      alert('לקוח נוסף בהצלחה!')
      onClose()
    } catch (error) {
      console.error('שגיאה בהוספת לקוח:', error)
      alert('שגיאה בהוספת לקוח')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div>
        <button onClick={onClose} className="btn-secondary mb-4">
          ← חזרה לרשימת לקוחות
        </button>

        <div className="card">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            ➕ הוספת לקוח חדש
          </h1>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">שם לקוח *</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="הכנס שם לקוח"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">טלפון *</label>
                <input
                  type="tel"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="050-1234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">אימייל</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">כתובת</label>
              <input
                type="text"
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="כתובת מלאה"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">הערות</label>
              <textarea
                className="input-field"
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={saveCustomer}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'שומר...' : 'שמור לקוח'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
