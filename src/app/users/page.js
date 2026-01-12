'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, UserCheck } from 'lucide-react'
import Layout from '@/components/Layout'

export const dynamic = 'force-dynamic'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('שגיאה בטעינת משתמשים:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-center py-8">
            <p className="text-white text-2xl">טוען...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="card">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span>👨‍💼</span>
                ניהול משתמשים
              </h1>
              <p className="text-gray-600">ניהול הרשאות וגישת משתמשים למערכת</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              הוסף משתמש
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">אין משתמשים במערכת</div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                הוסף משתמש ראשון
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right font-bold">שם משתמש</th>
                    <th className="px-6 py-3 text-right font-bold">אימייל</th>
                    <th className="px-6 py-3 text-right font-bold">תפקיד</th>
                    <th className="px-6 py-3 text-right font-bold">סטטוס</th>
                    <th className="px-6 py-3 text-right font-bold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-semibold">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-sm rounded-full font-semibold ${
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-900 font-bold ml-4">ערוך</button>
                        <button className="text-red-600 hover:text-red-900 font-bold">מחק</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

