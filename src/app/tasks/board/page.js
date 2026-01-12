'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Plus, Edit2, Trash2, X, Save, MoreHorizontal, Calendar, User } from 'lucide-react'
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function TasksBoard() {
  const [tasks, setTasks] = useState([])
  const [departments, setDepartments] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [departmentForm, setDepartmentForm] = useState({ name: '' })
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', order_id: null })
  const [orders, setOrders] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  useEffect(() => {
    fetchBoardData()
  }, [])

  const fetchBoardData = async () => {
    try {
      // שליפת מחלקות
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('*')
        .order('position')

      // שליפת עמודות
      const { data: columnsData } = await supabase
        .from('columns')
        .select('*')
        .order('department_id, position')

      // שליפת משימות עם מידע על הזמנות
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          orders (
            order_number,
            customer_name,
            customer_phone
          )
        `)
        .order('position')

      // שליפת הזמנות לטופס
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, order_number, customer_name')
        .order('order_number DESC')

      setDepartments(departmentsData || [])
      setColumns(columnsData || [])
      setTasks(tasksData || [])
      setOrders(ordersData || [])
      // Set first department as selected by default
      if (departmentsData && departmentsData.length > 0) {
        setSelectedDepartment(departmentsData[0].id)
      }
    } catch (error) {
      console.error('שגיאה בטעינת לוח משימות:', error)
    } finally {
      setLoading(false)
    }
  }

  // Task management functions
  const handleAddTask = (columnId) => {
    setEditingTask(null)
    setTaskForm({ title: '', description: '', order_id: null, column_id: columnId })
    setShowTaskModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskForm({ 
      title: task.title || '', 
      description: task.description || task.notes || '', 
      order_id: task.order_id,
      column_id: task.column_id
    })
    setShowTaskModal(true)
  }

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return

    try {
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({ 
            title: taskForm.title,
            description: taskForm.description,
            notes: taskForm.description,
            order_id: taskForm.order_id
          })
          .eq('id', editingTask.id)
        
        if (error) throw error
      } else {
        // Add new task
        const { error } = await supabase
          .from('tasks')
          .insert({ 
            title: taskForm.title,
            description: taskForm.description,
            notes: taskForm.description,
            order_id: taskForm.order_id,
            column_id: taskForm.column_id,
            department_id: selectedDepartment
          })
        
        if (error) throw error
      }

      setShowTaskModal(false)
      fetchBoardData()
    } catch (error) {
      console.error('שגיאה בשמירת משימה:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (error) throw error
      
      fetchBoardData()
    } catch (error) {
      console.error('שגיאה במחיקת משימה:', error)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    const task = tasks.find(t => t.id === active.id)
    setDraggedTask(task)
  }

  const handleDragOver = (event) => {
    // Handle drag over logic if needed
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      setDraggedTask(null)
      return
    }

    const taskId = active.id
    const newColumnId = over.id

    // Find the task and its current column
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.column_id === newColumnId) {
      setActiveId(null)
      setDraggedTask(null)
      return
    }

    try {
      // Update task column
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: newColumnId })
        .eq('id', taskId)
      
      if (error) throw error
      
      fetchBoardData()
    } catch (error) {
      console.error('שגיאה בהעברת משימה:', error)
    }

    setActiveId(null)
    setDraggedTask(null)
  }

  // TaskCard component for drag and drop
  const TaskCard = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white rounded-lg p-3 mb-2 cursor-move border border-gray-200 hover:shadow-md transition-shadow group"
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm text-gray-800 flex-1">
            {task.title || 'משימה ללא כותרת'}
          </h4>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEditTask(task)
              }}
              className="text-blue-500 hover:text-blue-700 p-1"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteTask(task.id)
              }}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
        )}
        
        {task.orders && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              הזמנה #{task.orders.order_number}
            </span>
            <span>{task.orders.customer_name}</span>
          </div>
        )}
        
        {task.created_at && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
            <Calendar size={12} />
            <span>{new Date(task.created_at).toLocaleDateString('he-IL')}</span>
          </div>
        )}
      </div>
    )
  }

  const handleAddDepartment = () => {
    setEditingDepartment(null)
    setDepartmentForm({ name: '' })
    setShowDepartmentModal(true)
  }

  const handleEditDepartment = (department) => {
    setEditingDepartment(department)
    setDepartmentForm({ name: department.name })
    setShowDepartmentModal(true)
  }

  const handleSaveDepartment = async () => {
    if (!departmentForm.name.trim()) return

    try {
      if (editingDepartment) {
        // Update existing department
        const { error } = await supabase
          .from('departments')
          .update({ name: departmentForm.name })
          .eq('id', editingDepartment.id)
        
        if (error) throw error
      } else {
        // Add new department
        const { error } = await supabase
          .from('departments')
          .insert({ name: departmentForm.name })
        
        if (error) throw error
      }

      setShowDepartmentModal(false)
      fetchBoardData()
    } catch (error) {
      console.error('שגיאה בשמירת מחלקה:', error)
    }
  }

  const handleDeleteDepartment = async (departmentId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מחלקה זו?')) return

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId)
      
      if (error) throw error
      
      fetchBoardData()
    } catch (error) {
      console.error('שגיאה במחיקת מחלקה:', error)
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
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <span>📌</span>
                לוח משימות
              </h1>
              <p className="text-gray-600">ניהול משימות לפי מחלקות וסטטוס</p>
            </div>
            <button
              onClick={handleAddDepartment}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              הוסף מחלקה
            </button>
          </div>
        </div>

        {/* Department Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            {departments.map(department => (
              <div key={department.id} className="relative group">
                <button
                  onClick={() => setSelectedDepartment(department.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedDepartment === department.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {department.name}
                </button>
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-lg"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(department.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kanban Board with Drag and Drop */}
        {selectedDepartment && (
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {columns
                .filter(col => col.department_id === selectedDepartment)
                .map(column => {
                  const columnTasks = tasks.filter(task => task.column_id === column.id)
                  
                  return (
                    <div key={column.id} className="bg-gray-100 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-lg text-gray-700">{column.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {columnTasks.length}
                          </span>
                          <button
                            onClick={() => handleAddTask(column.id)}
                            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <SortableContext
                        items={columnTasks.map(task => task.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="min-h-[200px] space-y-2">
                          {columnTasks.map(task => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </SortableContext>
                      
                      {columnTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p className="text-sm">אין משימות בעמודה זו</p>
                          <button
                            onClick={() => handleAddTask(column.id)}
                            className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                          >
                            + הוסף משימה
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
            
            <DragOverlay>
              {activeId && draggedTask ? (
                <div className="bg-white rounded-lg p-3 shadow-xl border-2 border-blue-400">
                  <h4 className="font-medium text-sm text-gray-800">
                    {draggedTask.title || 'משימה ללא כותרת'}
                  </h4>
                  {draggedTask.description && (
                    <p className="text-xs text-gray-600 mt-1">{draggedTask.description}</p>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Department Modal */}
        {showDepartmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingDepartment ? 'ערוך מחלקה' : 'הוסף מחלקה חדשה'}
                </h3>
                <button
                  onClick={() => setShowDepartmentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <input
                type="text"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ name: e.target.value })}
                placeholder="שם המחלקה"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowDepartmentModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSaveDepartment}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save size={16} />
                  שמור
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingTask ? 'ערוך משימה' : 'הוסף משימה חדשה'}
                </h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    כותרת המשימה
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="כותרת המשימה"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור המשימה
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="תיאור המשימה"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    הזמנה (לא חובה)
                  </label>
                  <select
                    value={taskForm.order_id || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, order_id: e.target.value || null })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">בחר הזמנה</option>
                    {orders.map(order => (
                      <option key={order.id} value={order.id}>
                        הזמנה #{order.order_number} - {order.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSaveTask}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save size={16} />
                  שמור
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
