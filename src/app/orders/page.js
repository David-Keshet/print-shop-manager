'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Edit2, Trash2, FileText, Download } from 'lucide-react'
import Layout from '@/components/Layout'
import OrderPDF from '@/components/OrderPDF'

export const dynamic = 'force-dynamic'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewOrder, setShowNewOrder] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  // טעינת הזמנות
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('שגיאה בטעינת הזמנות:', error)
    } finally {
      setLoading(false)
    }
  }

  // מחיקת הזמנה
  const deleteOrder = async (orderId, orderNumber) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הזמנה מספר ${orderNumber}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error

      alert('ההזמנה נמחקה בהצלחה')
      fetchOrders()
    } catch (error) {
      console.error('שגיאה במחיקת הזמנה:', error)
      alert('שגיאה במחיקת ההזמנה')
    }
  }

  // צפייה בהזמנה
  const viewOrder = async (order) => {
    try {
      // שליפת פריטי ההזמנה
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      if (error) throw error

      setSelectedOrder(order)
      setOrderItems(items || [])
    } catch (error) {
      console.error('שגיאה בטעינת פרטי הזמנה:', error)
      alert('שגיאה בטעינת פרטי ההזמנה')
    }
  }

  // סינון הזמנות לפי חיפוש
  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm) ||
    order.order_number.toString().includes(searchTerm)
  )

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const statusText = {
    new: 'חדשה',
    in_progress: 'בתהליך',
    completed: 'הושלמה',
    cancelled: 'בוטלה'
  }

  if (showNewOrder) {
    return (
      <Layout>
        <NewOrderForm onClose={() => { setShowNewOrder(false); fetchOrders(); }} />
      </Layout>
    )
  }

  // תצוגת PDF להזמנה נבחרת
  if (selectedOrder) {
    return (
      <Layout>
        <div className="p-8">
          <div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="btn-secondary mb-4"
            >
              ← חזרה לרשימת הזמנות
            </button>
            <OrderPDF order={selectedOrder} items={orderItems} standalone={true} />
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
          {/* כותרת וכפתור הזמנה חדשה */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span>📦</span>
              הזמנות
            </h1>
            <button
              onClick={() => setShowNewOrder(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              הזמנה חדשה
            </button>
          </div>

          {/* חיפוש */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חפש לפי שם לקוח, טלפון או מספר הזמנה..."
                className="input-field pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* טבלת הזמנות */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">טוען הזמנות...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'לא נמצאו הזמנות' : 'אין הזמנות במערכת'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowNewOrder(true)}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  צור הזמנה ראשונה
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-right font-bold">מספר הזמנה</th>
                    <th className="px-4 py-3 text-right font-bold">שם לקוח</th>
                    <th className="px-4 py-3 text-right font-bold">טלפון</th>
                    <th className="px-4 py-3 text-right font-bold">סכום</th>
                    <th className="px-4 py-3 text-right font-bold">סטטוס</th>
                    <th className="px-4 py-3 text-right font-bold">תאריך</th>
                    <th className="px-4 py-3 text-center font-bold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50 cursor-pointer">
                      <td
                        className="px-4 py-3 font-bold text-blue-600"
                        onClick={() => viewOrder(order)}
                      >
                        #{order.order_number}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={() => viewOrder(order)}
                      >
                        {order.customer_name}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600"
                        onClick={() => viewOrder(order)}
                      >
                        {order.customer_phone}
                      </td>
                      <td
                        className="px-4 py-3 font-bold"
                        onClick={() => viewOrder(order)}
                      >
                        ₪{order.total_with_vat.toFixed(2)}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={() => viewOrder(order)}
                      >
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
                          {statusText[order.status]}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600"
                        onClick={() => viewOrder(order)}
                      >
                        {new Date(order.created_at).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              viewOrder(order)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="צפה בהזמנה"
                          >
                            <FileText size={20} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteOrder(order.id, order.order_number)
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="מחק הזמנה"
                          >
                            <Trash2 size={20} />
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

// טופס הזמנה חדשה
function NewOrderForm({ onClose }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [items, setItems] = useState([
    { description: '', quantity: '', price: '' }
  ])
  const [loading, setLoading] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)

  const addItem = () => {
    setItems([...items, { description: '', quantity: '', price: '' }])
  }

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)
      return sum + itemTotal
    }, 0)
  }

  const total = calculateTotal()
  const vat = total * 0.18
  const totalWithVat = total + vat

  // שליחת הודעת WhatsApp
  const sendWhatsAppNotification = async (orderNumber, customerName, customerPhone) => {
    try {
      // קבלת נוסח ההודעה מהגדרות
      const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'whatsapp_new_order')
        .single()

      let message = settings?.value || 'שלום {customer_name}, נפתחה עבורך הזמנה מספר {order_number}'

      // החלפת משתנים
      message = message
        .replace('{customer_name}', customerName)
        .replace('{order_number}', orderNumber)

      // שליחה לAPI
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: customerPhone, message })
      })

      const result = await response.json()
      if (result.success) {
        console.log('✅ הודעת WhatsApp נשלחה')
      }
    } catch (error) {
      console.error('❌ שגיאה בשליחת WhatsApp:', error)
    }
  }

  const saveOrder = async () => {
    if (!customerName || !customerPhone) {
      alert('אנא מלא שם לקוח וטלפון')
      return
    }

    if (items.every(item => !item.description)) {
      alert('אנא הוסף לפחות פריט אחד')
      return
    }

    setLoading(true)

    try {
      // יצירת או מציאת לקוח
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', customerPhone)
        .single()

      let customerId = existingCustomer?.id

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{ name: customerName, phone: customerPhone }])
          .select()
          .single()

        if (customerError) throw customerError
        customerId = newCustomer.id
      }

      // יצירת הזמנה
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: customerId,
          customer_name: customerName,
          customer_phone: customerPhone,
          total: total,
          vat: vat,
          total_with_vat: totalWithVat,
          status: 'new'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // הוספת פריטים להזמנה
      const orderItems = items
        .filter(item => item.description)
        .map(item => ({
          order_id: order.id,
          description: item.description,
          quantity: parseInt(item.quantity) || 0,
          price: parseFloat(item.price) || 0
        }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // יצירת משימה במחלקת מזכירות
      const { data: firstColumn } = await supabase
        .from('columns')
        .select('id, department_id')
        .order('position')
        .limit(1)
        .single()

      if (firstColumn) {
        await supabase
          .from('tasks')
          .insert([{
            order_id: order.id,
            column_id: firstColumn.id,
            department_id: firstColumn.department_id,
            position: 0
          }])
      }

      // שליחת הודעת WhatsApp
      await sendWhatsAppNotification(order.order_number, customerName, customerPhone)

      // שמירת ההזמנה האחרונה להצגת PDF
      setLastOrder({ ...order, items: orderItems })

      alert(`הזמנה ${order.order_number} נשמרה בהצלחה!`)

      // איפוס הטופס
      setCustomerName('')
      setCustomerPhone('')
      setItems([{ description: '', quantity: '', price: '' }])

    } catch (error) {
      console.error('שגיאה בשמירת הזמנה:', error)
      alert('שגיאה בשמירת ההזמנה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div>
        <button onClick={onClose} className="btn-secondary mb-4">
          ← חזרה לרשימת הזמנות
        </button>

        <div className="card">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            📋 פתיחת הזמנה חדשה
          </h1>

          {/* פרטי לקוח */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">שם לקוח *</label>
              <input
                type="text"
                className="input-field"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="הכנס שם לקוח"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">טלפון *</label>
              <input
                type="tel"
                className="input-field"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="050-1234567"
              />
            </div>
          </div>

          {/* פריטי הזמנה */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">פריטי ההזמנה</h2>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 mb-3">
                <div className="col-span-6">
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="תיאור המוצר"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    className="input-field text-sm"
                    placeholder="כמות"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    className="input-field text-sm"
                    placeholder="מחיר ₪"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addItem}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold mt-2"
            >
              <Plus size={20} />
              הוסף פריט
            </button>
          </div>

          {/* סיכום */}
          <div className="border-t-2 border-gray-200 pt-4 mb-6">
            <div className="flex justify-between text-lg mb-2">
              <span className="font-bold">סה"כ:</span>
              <span>₪{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg mb-2">
              <span className="font-bold">מע"מ (18%):</span>
              <span>₪{vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-blue-600">
              <span>סה"כ כולל מע"מ:</span>
              <span>₪{totalWithVat.toFixed(2)}</span>
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-3">
            <button
              onClick={saveOrder}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? 'שומר...' : 'שמור הזמנה'}
            </button>
            <button onClick={onClose} className="btn-secondary">
              ביטול
            </button>
          </div>

          {/* כפתור PDF */}
          {lastOrder && (
            <OrderPDF order={lastOrder} items={lastOrder.items} />
          )}
        </div>
      </div>
    </div>
  )
}
