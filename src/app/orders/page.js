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
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [prefilledCustomer, setPrefilledCustomer] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

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

  // עריכת הזמנה
  const editOrder = async (order) => {
    try {
      // שליפת פריטי ההזמנה
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      if (error) throw error

      // שליפת המשימה הקשורה להזמנה כדי לקבל את העמודה והמחלקה הנוכחיים
      const { data: task } = await supabase
        .from('tasks')
        .select('column_id, department_id')
        .eq('order_id', order.id)
        .single()

      setEditingOrder({
        ...order,
        items: items || [],
        current_column_id: task?.column_id,
        current_department_id: task?.department_id
      })
      setShowNewOrder(true)
    } catch (error) {
      console.error('שגיאה בטעינת פרטי הזמנה לעריכה:', error)
      alert('שגיאה בטעינת פרטי ההזמנה')
    }
  }

  // צפייה בפרטי הזמנה
  const viewOrder = async (order) => {
    setSelectedOrder(order)

    try {
      // שליפת פריטי ההזמנה
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      if (error) throw error
      setOrderItems(items || [])
    } catch (error) {
      console.error('שגיאה בטעינת פריטי הזמנה:', error)
      setOrderItems([])
    }
  }

  // סינון הזמנות לפי חיפוש
  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm) ||
    order.order_number.toString().includes(searchTerm)
  )

  // Function to get status color based on keywords in status text
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700'

    const statusLower = status.toLowerCase()

    // Keywords for different colors
    if (statusLower.includes('ממתין') || statusLower.includes('חדש') || statusLower === 'new') {
      return 'bg-blue-100 text-blue-700'
    }
    if (statusLower.includes('בוטל') || statusLower.includes('ביטול') || statusLower === 'cancelled') {
      return 'bg-red-100 text-red-700'
    }
    if (statusLower.includes('מוכן') || statusLower.includes('הושלם') || statusLower.includes('נמסר') || statusLower === 'completed') {
      return 'bg-green-100 text-green-700'
    }

    // Default for any in-progress status
    return 'bg-yellow-100 text-yellow-700'
  }

  if (showNewOrder) {
    return (
      <Layout>
        <OrderForm
          initialCustomer={prefilledCustomer}
          editData={editingOrder}
          onClose={() => {
            setShowNewOrder(false);
            setPrefilledCustomer(null);
            setEditingOrder(null);
            fetchOrders();
          }}
        />
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
                onClick={() => setShowSearchModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={20} />
                הזמנה חדשה
              </button>
            </div>

            {showSearchModal && (
              <CustomerSearchModal
                onClose={() => setShowSearchModal(false)}
                onConfirm={(customer, mode) => {
                  setPrefilledCustomer(customer);
                  setShowSearchModal(false);
                  setShowNewOrder(true);
                }}
              />
            )}

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
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                            {order.status}
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
                                editOrder(order)
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="ערוך הזמנה"
                            >
                              <Edit2 size={20} />
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

// טופס הזמנה
function OrderForm({ onClose, initialCustomer, editData }) {
  const [customerName, setCustomerName] = useState(editData?.customer_name || initialCustomer?.name || '')
  const [customerPhone, setCustomerPhone] = useState(editData?.customer_phone || initialCustomer?.phone || '')
  const [customerId, setCustomerId] = useState(editData?.customer_id || initialCustomer?.id || null)
  const [items, setItems] = useState(editData?.items?.map(item => ({
    ...item,
    unitPrice: item.unit_price || (item.price / item.quantity) || 0,
    totalPrice: item.price || 0,
    notes: item.notes || ''
  })) || [
      { description: '', quantity: 1, unitPrice: '', totalPrice: '', notes: '' }
    ])
  const [loading, setLoading] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)

  // Function to get status color based on keywords in status text
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700'

    const statusLower = status.toLowerCase()

    // Keywords for different colors
    if (statusLower.includes('ממתין') || statusLower.includes('חדש') || statusLower === 'new') {
      return 'bg-blue-100 text-blue-700'
    }
    if (statusLower.includes('בוטל') || statusLower.includes('ביטול') || statusLower === 'cancelled') {
      return 'bg-red-100 text-red-700'
    }
    if (statusLower.includes('מוכן') || statusLower.includes('הושלם') || statusLower.includes('נמסר') || statusLower === 'completed') {
      return 'bg-green-100 text-green-700'
    }

    // Default for any in-progress status
    return 'bg-yellow-100 text-yellow-700'
  }

  // State למחלקות ועמודות
  const [departments, setDepartments] = useState([])
  const [columns, setColumns] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedColumn, setSelectedColumn] = useState('')

  // טעינת מחלקות ועמודות בעת טעינת הקומפוננטה
  useEffect(() => {
    fetchDepartmentsAndColumns()
  }, [])

  const fetchDepartmentsAndColumns = async () => {
    try {
      // טעינת מחלקות
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (deptsError) throw deptsError
      setDepartments(depts || [])

      // טעינת עמודות
      const { data: cols, error: colsError } = await supabase
        .from('columns')
        .select('id, name, department_id, position')
        .order('position')

      if (colsError) throw colsError
      setColumns(cols || [])

      // אם זו עריכה - טען את העמודה והמחלקה הנוכחיים
      if (editData?.current_column_id && editData?.current_department_id) {
        setSelectedColumn(editData.current_column_id)
        setSelectedDepartment(editData.current_department_id)
      }
      // אחרת - בחירה אוטומטית של העמודה הראשונה כברירת מחדל
      else if (cols && cols.length > 0) {
        setSelectedColumn(cols[0].id)
        setSelectedDepartment(cols[0].department_id)
      }
    } catch (error) {
      console.error('שגיאה בטעינת מחלקות ועמודות:', error)
    }
  }

  // עדכון עמודות זמינות כאשר משנים מחלקה
  const handleDepartmentChange = (deptId) => {
    setSelectedDepartment(deptId)
    const deptColumns = columns.filter(col => col.department_id === deptId)
    if (deptColumns.length > 0) {
      setSelectedColumn(deptColumns[0].id)
    } else {
      setSelectedColumn('')
    }
  }

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

    // חישובים אוטומטיים
    const qty = parseFloat(newItems[index].quantity) || 0
    if (field === 'unitPrice') {
      newItems[index].totalPrice = (qty * (parseFloat(value) || 0)).toFixed(2)
    } else if (field === 'totalPrice') {
      newItems[index].unitPrice = qty > 0 ? ((parseFloat(value) || 0) / qty).toFixed(2) : 0
    } else if (field === 'quantity') {
      const up = parseFloat(newItems[index].unitPrice) || 0
      newItems[index].totalPrice = (qty * up).toFixed(2)
    }

    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return sum + (parseFloat(item.totalPrice) || 0)
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

    // ולידציה למחלקה ועמודה (גם בעריכה וגם בהזמנה חדשה)
    if (!selectedDepartment || !selectedColumn) {
      alert('אנא בחר מחלקה ועמודה לניתוב ההזמנה')
      return
    }

    setLoading(true)

    try {
      let finalCustomerId = customerId

      if (!finalCustomerId) {
        // חיפוש לפי טלפון למקרה שלא הגיע מחיפוש קודם
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customerPhone)
          .single()

        finalCustomerId = existingCustomer?.id
      }

      if (!finalCustomerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{ name: customerName, phone: customerPhone }])
          .select()
          .single()

        if (customerError) throw customerError
        finalCustomerId = newCustomer.id
      } else {
        // עדכון פרטי לקוח קיים במידה ושונה השם
        await supabase
          .from('customers')
          .update({ name: customerName })
          .eq('id', finalCustomerId)
      }

      if (editData) {
        // עדכון הזמנה קיימת
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            customer_name: customerName,
            customer_phone: customerPhone,
            total: total,
            vat: vat,
            total_with_vat: totalWithVat
          })
          .eq('id', editData.id)

        if (orderError) throw orderError

        // עדכון פריטים: מחיקה והוספה מחדש (הכי פשוט ובטוח)
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', editData.id)

        const orderItems = items
          .filter(item => item.description)
          .map(item => ({
            order_id: editData.id,
            description: item.description,
            quantity: parseInt(item.quantity) || 0,
            price: parseFloat(item.totalPrice) || 0,
            unit_price: parseFloat(item.unitPrice) || 0,
            notes: item.notes || ''
          }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError

        // עדכון המשימה - העברה לעמודה ומחלקה חדשים אם נבחרו
        await supabase
          .from('tasks')
          .update({
            column_id: selectedColumn,
            department_id: selectedDepartment
          })
          .eq('order_id', editData.id)

        alert(`הזמנה ${editData.order_number} עודכנה בהצלחה!`)
        onClose()
        return
      }

      // יצירת הזמנה חדשה (לוגיקה קיימת)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: finalCustomerId,
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
          price: parseFloat(item.totalPrice) || 0,
          unit_price: parseFloat(item.unitPrice) || 0,
          notes: item.notes || ''
        }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // יצירת משימה במחלקה והעמודה שנבחרו
      if (selectedColumn && selectedDepartment) {
        await supabase
          .from('tasks')
          .insert([{
            order_id: order.id,
            column_id: selectedColumn,
            department_id: selectedDepartment,
            position: 0
          }])
      }

      // שליחת הודעת WhatsApp
      await sendWhatsAppNotification(order.order_number, customerName, customerPhone)

      alert(`הזמנה ${order.order_number} נשמרה בהצלחה!`)

      // חזרה לרשימת הזמנות
      onClose()

    } catch (error) {
      console.error('שגיאה בשמירת הזמנה:', error)
      alert('שגיאה בשמירת ההזמנה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[100vw] mx-auto p-4 md:p-6 lg:p-8">
        <button onClick={onClose} className="btn-secondary mb-4">
          ← חזרה לרשימת הזמנות
        </button>

        <div className="bg-white rounded-xl shadow-lg border-t-4 border-blue-600 p-4 md:p-6 lg:p-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center bg-gray-50 py-4 rounded-lg">
              {editData ? `✏️ עריכת הזמנה ${editData.order_number}` : '📋 פתיחת הזמנה חדשה'}
            </h1>

            {/* תצוגת סטטוס נוכחי */}
            {editData && editData.status && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-semibold">סטטוס נוכחי:</span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(editData.status)}`}>
                    {editData.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
            {/* צד ימין - פרטי הזמנה ולקוח */}
            <div className="flex-1">
              <div className="bg-gray-50 p-6 rounded-xl mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  👤 פרטי לקוח
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-bold mb-1">שם לקוח *</label>
                    <input
                      type="text"
                      className="input-field bg-white border-gray-300"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="הכנס שם לקוח"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-bold mb-1">טלפון *</label>
                    <input
                      type="tel"
                      className="input-field bg-white border-gray-300"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="050-1234567"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📦 פריטי ההזמנה
                  </h2>
                  <button
                    onClick={addItem}
                    className="btn-secondary text-sm flex items-center gap-2 py-1.5 px-4"
                  >
                    <Plus size={16} />
                    הוסף פריט
                  </button>
                </div>

                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div key={index} className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-12 gap-4">
                        {/* תיאור מוצר - דואמיננטי */}
                        <div className="col-span-12 md:col-span-6">
                          <label className="block text-gray-500 text-xs font-bold mb-1">תיאור המוצר</label>
                          <input
                            type="text"
                            className="input-field text-sm font-semibold border-gray-200"
                            placeholder="מה מזמינים?"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                          />
                        </div>

                        {/* כמות */}
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-gray-500 text-xs font-bold mb-1">כמות</label>
                          <input
                            type="number"
                            className="input-field text-sm border-gray-200 text-center"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          />
                        </div>

                        {/* מחיר ליחידה */}
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-gray-500 text-xs font-bold mb-1">מחיר ליח' ₪</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input-field text-sm border-gray-200 text-center"
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          />
                        </div>

                        {/* מחיר סופי למוצר */}
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-gray-500 text-xs font-bold mb-1 font-bold text-blue-600">סה"כ פריט ₪</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input-field text-sm border-2 border-blue-100 bg-blue-50 font-bold text-center"
                            placeholder="0.00"
                            value={item.totalPrice}
                            onChange={(e) => updateItem(index, 'totalPrice', e.target.value)}
                          />
                        </div>

                        {/* הערות ומיקום קובץ */}
                        <div className="col-span-12">
                          <label className="block text-gray-500 text-xs font-bold mb-1">הערות ומיקום קובץ (איפה הקובץ שמור?)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400"><Download size={16} /></span>
                            <input
                              type="text"
                              className="input-field text-sm border-gray-100 bg-gray-50 pr-8"
                              placeholder="לדוגמה: כונן D / תיקיית לקוחות / 2024 / שם הלקוח..."
                              value={item.notes}
                              onChange={(e) => updateItem(index, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* כפתור מחיקה */}
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="absolute -left-3 -top-3 bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors border-2 border-white shadow-sm"
                          title="מחק פריט"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* צד שמאל - סיכום ופעולות */}
            <div className="w-full xl:w-96">
              <div className="xl:sticky xl:top-8 space-y-4">
                <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-xl">
                  <h2 className="text-xl font-bold mb-6 border-b border-blue-400 pb-2">סיכום הזמנה</h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center opacity-90">
                      <span>סה"כ לפני מע"מ</span>
                      <span className="font-semibold text-lg">₪{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-90">
                      <span>מע"מ (18%)</span>
                      <span className="font-semibold text-lg">₪{vat.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-blue-400 pt-4 mt-4">
                      <div className="flex flex-col">
                        <span className="text-sm opacity-80 mb-1 font-bold">סה"כ לתשלום כולל מע"מ</span>
                        <span className="text-4xl font-extrabold tracking-tight">
                          ₪{totalWithVat.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* בחירת מחלקה ועמודה */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    🎯 ניתוב הזמנה
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-600 text-xs font-bold mb-1">מחלקה *</label>
                      <select
                        className="input-field text-sm bg-white border-gray-300"
                        value={selectedDepartment}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                      >
                        <option value="">בחר מחלקה</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 text-xs font-bold mb-1">עמודה *</label>
                      <select
                        className="input-field text-sm bg-white border-gray-300"
                        value={selectedColumn}
                        onChange={(e) => setSelectedColumn(e.target.value)}
                        disabled={!selectedDepartment}
                      >
                        <option value="">בחר עמודה</option>
                        {columns
                          .filter(col => col.department_id === selectedDepartment)
                          .map(col => (
                            <option key={col.id} value={col.id}>
                              {col.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={saveOrder}
                    disabled={loading}
                    className="btn-primary w-full py-4 text-xl font-bold rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {loading ? 'שומר...' : (
                      <>
                        <span>{editData ? 'עדכון הזמנה' : 'שמור הזמנה'}</span>
                        <FileText size={24} />
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-secondary w-full py-3 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    ביטול וחזרה
                  </button>
                </div>

                {/* כפתור PDF */}
                {lastOrder && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                    <span className="text-green-800 font-bold">הזמנה מוכנה!</span>
                    <OrderPDF order={lastOrder} items={lastOrder.items} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerSearchModal({ onClose, onConfirm }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const searchCustomer = async () => {
    if (!query) return
    setLoading(true)
    setSearched(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(5)

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('Error searching customer:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">חיפוש לקוח</h2>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="input-field"
            placeholder="טלפון או שם לקוח..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCustomer()}
            autoFocus
          />
          <button
            onClick={searchCustomer}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'מחפש...' : <Search size={20} />}
          </button>
        </div>

        <div className="space-y-4 max-h-60 overflow-y-auto mb-6">
          {results.length > 0 ? (
            results.map(customer => (
              <div key={customer.id} className="border rounded-lg p-4 hover:bg-blue-50 transition-colors">
                <div className="font-bold text-lg mb-1">{customer.name}</div>
                <div className="text-gray-600 mb-3">{customer.phone}</div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onConfirm(customer, 'existing')}
                    className="btn-primary text-sm py-2"
                  >
                    פתח הזמנה על שם {customer.name}
                  </button>
                  <button
                    onClick={() => onConfirm(customer, 'edit')}
                    className="btn-secondary text-sm py-2"
                  >
                    שנה פרטים ופתח הזמנה
                  </button>
                  <button
                    onClick={() => onConfirm({ ...customer, id: null }, 'new')}
                    className="btn-secondary text-sm py-2 bg-gray-100 border-gray-300 text-gray-700"
                  >
                    פתח לקוח חדש עם שם זה
                  </button>
                </div>
              </div>
            ))
          ) : searched && !loading ? (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">לא נמצא לקוח תואם</p>
              <button
                onClick={() => onConfirm({ phone: query.match(/^\d+$/) ? query : '', name: !query.match(/^\d+$/) ? query : '' }, 'new')}
                className="btn-primary w-full"
              >
                המשך כעסק חדש / לקוח חדש
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              הזן פרטי חיפוש כדי למצוא לקוח קיים
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(null, 'new')}
            className="btn-secondary flex-1"
          >
            דלג והמשך ללקוח חדש
          </button>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
