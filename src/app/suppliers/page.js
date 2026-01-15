'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Truck, Plus, Search, Edit, Trash2 } from 'lucide-react'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      // Placeholder data until API is implemented
      setSuppliers([
        { id: 1, name: 'ספק נייר איכות', phone: '03-1234567', email: 'paper@supplier.co.il', address: 'תל אביב' },
        { id: 2, name: 'דיו מקצועי', phone: '03-7654321', email: 'ink@supplier.co.il', address: 'חיפה' },
      ])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Truck size={32} />
                ספקים
              </h1>
              <p className="text-gray-400 mt-1">
                ניהול ספקים ויצרנים עבור בית הדפוס
              </p>
            </div>

            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus size={18} />
              ספק חדש
            </button>
          </div>

          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש ספקים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 pr-10 border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            טוען ספקים...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            לא נמצאו ספקים
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">שם ספק</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">טלפון</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">אימייל</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">כתובת</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-semibold">
                      {supplier.name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {supplier.phone}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {supplier.email}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {supplier.address}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-blue-400">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400">
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
    </Layout>
  )
}
