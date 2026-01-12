'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Plus, Edit2, Trash2, X, Save, Calendar, Tag, CheckSquare, Square, ArrowRight } from 'lucide-react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export const dynamic = 'force-dynamic'

export default function TasksBoard() {
  const [tasks, setTasks] = useState([])
  const [departments, setDepartments] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState(null)

  // Department management modal
  const [showDepartmentManagementModal, setShowDepartmentManagementModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [departmentForm, setDepartmentForm] = useState({ name: '' })

  // Column management modal
  const [showColumnManagementModal, setShowColumnManagementModal] = useState(false)
  const [showColumnModal, setShowColumnModal] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)
  const [columnForm, setColumnForm] = useState({ name: '', color: 'gray' })

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    order_id: null,
    labels: []
  })

  // Task detail modal
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)
  const [taskItems, setTaskItems] = useState([])

  const [orders, setOrders] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  // Labels for tasks
  const availableLabels = [
    { name: 'דחוף', color: 'bg-red-500' },
    { name: 'חשוב', color: 'bg-orange-500' },
    { name: 'רגיל', color: 'bg-blue-500' },
    { name: 'נמוך', color: 'bg-gray-500' }
  ]

  // Colors for columns
  const availableColors = [
    { name: 'gray', label: 'אפור', bgClass: 'bg-gray-100', borderClass: 'border-gray-300', textClass: 'text-gray-700' },
    { name: 'red', label: 'אדום', bgClass: 'bg-red-50', borderClass: 'border-red-300', textClass: 'text-red-700' },
    { name: 'orange', label: 'כתום', bgClass: 'bg-orange-50', borderClass: 'border-orange-300', textClass: 'text-orange-700' },
    { name: 'yellow', label: 'צהוב', bgClass: 'bg-yellow-50', borderClass: 'border-yellow-300', textClass: 'text-yellow-700' },
    { name: 'green', label: 'ירוק', bgClass: 'bg-green-50', borderClass: 'border-green-300', textClass: 'text-green-700' },
    { name: 'blue', label: 'כחול', bgClass: 'bg-blue-50', borderClass: 'border-blue-300', textClass: 'text-blue-700' },
    { name: 'purple', label: 'סגול', bgClass: 'bg-purple-50', borderClass: 'border-purple-300', textClass: 'text-purple-700' },
    { name: 'pink', label: 'ורוד', bgClass: 'bg-pink-50', borderClass: 'border-pink-300', textClass: 'text-pink-700' }
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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

  // Column management functions
  const handleAddColumn = () => {
    if (!selectedDepartment) {
      alert('אנא בחר מחלקה תחילה')
      return
    }
    setEditingColumn(null)
    setColumnForm({ name: '', color: 'gray' })
    setShowColumnModal(true)
  }

  const handleEditColumn = (column) => {
    setEditingColumn(column)
    setColumnForm({ name: column.name, color: column.color || 'gray' })
    setShowColumnModal(true)
  }

  const handleSaveColumn = async () => {
    if (!columnForm.name.trim()) return

    try {
      if (editingColumn) {
        // Update existing column
        const { error } = await supabase
          .from('columns')
          .update({
            name: columnForm.name,
            color: columnForm.color
          })
          .eq('id', editingColumn.id)

        if (error) throw error
      } else {
        // Add new column
        const maxPosition = columns
          .filter(col => col.department_id === selectedDepartment)
          .reduce((max, col) => Math.max(max, col.position || 0), 0)

        const { error } = await supabase
          .from('columns')
          .insert({
            name: columnForm.name,
            department_id: selectedDepartment,
            position: maxPosition + 1,
            color: columnForm.color
          })

        if (error) throw error
      }

      setShowColumnModal(false)
      fetchBoardData()
    } catch (error) {
      console.error('שגיאה בשמירת עמודה:', error)
    }
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

  const handleDeleteColumn = async (columnId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק עמודה זו? כל המשימות בה יימחקו.')) return

    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId)

      if (error) throw error

      fetchBoardData()
    } catch (error) {
      console.error('שגיאה במחיקת עמודה:', error)
    }
  }

  // Task management functions
  const handleAddTask = (columnId) => {
    setEditingTask(null)
    setTaskForm({
      title: '',
      description: '',
      order_id: null,
      column_id: columnId,
      labels: []
    })
    setShowTaskModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title || '',
      description: task.description || task.notes || '',
      order_id: task.order_id,
      column_id: task.column_id,
      labels: task.labels || []
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
            order_id: taskForm.order_id,
            labels: taskForm.labels
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
            department_id: selectedDepartment,
            labels: taskForm.labels
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

  // View task details
  const handleViewTaskDetails = async (task) => {
    setSelectedTask(task)
    setShowTaskDetailModal(true)

    if (task.order_id) {
      try {
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', task.order_id)
          .single()

        if (orderError) throw orderError

        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', task.order_id)

        if (itemsError) throw itemsError

        setOrderDetails(orderData)
        setTaskItems(itemsData.map(item => ({
          ...item,
          completed: false
        })))
      } catch (error) {
        console.error('שגיאה בטעינת פרטי הזמנה:', error)
      }
    }
  }

  const toggleTaskItem = (itemId) => {
    setTaskItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }

  // Move task to different department
  const handleMoveTaskToDepartment = async (task, targetDepartmentId) => {
    const targetColumns = columns.filter(col => col.department_id === targetDepartmentId)

    if (targetColumns.length === 0) {
      alert('המחלקה הנבחרת אינה מכילה עמודות')
      return
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          department_id: targetDepartmentId,
          column_id: targetColumns[0].id
        })
        .eq('id', task.id)

      if (error) throw error

      fetchBoardData()
    } catch (error) {
      console.error('שגיאה בהעברת משימה למחלקה:', error)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    const task = tasks.find(t => t.id === active.id)
    setDraggedTask(task)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setDraggedTask(null)
      return
    }

    const taskId = active.id
    const overId = over.id

    // Check if dropping on a column (droppable area)
    const isColumn = columns.some(col => col.id === overId)

    if (isColumn) {
      const task = tasks.find(t => t.id === taskId)
      if (!task || task.column_id === overId) {
        setActiveId(null)
        setDraggedTask(null)
        return
      }

      try {
        // Update task column
        const { error } = await supabase
          .from('tasks')
          .update({ column_id: overId })
          .eq('id', taskId)

        if (error) throw error

        fetchBoardData()
      } catch (error) {
        console.error('שגיאה בהעברת משימה:', error)
      }
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

    const taskLabels = task.labels || []

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // Only open if not dragging
          if (!isDragging) {
            handleViewTaskDetails(task)
          }
        }}
        className="bg-white rounded-lg p-3 mb-2 cursor-pointer border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
      >
        <div className="mb-2">
          <h4 className="font-medium text-sm text-gray-800">
            {task.title || 'משימה ללא כותרת'}
          </h4>
        </div>

        {taskLabels.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {taskLabels.map((label, idx) => {
              const labelConfig = availableLabels.find(l => l.name === label) || availableLabels[2]
              return (
                <span key={idx} className={`${labelConfig.color} text-white text-xs px-2 py-0.5 rounded-full`}>
                  {label}
                </span>
              )
            })}
          </div>
        )}

        {task.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
        )}

        {task.orders && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
              הזמנה #{task.orders.order_number}
            </span>
            <span>{task.orders.customer_name}</span>
          </div>
        )}

        {task.created_at && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} />
            <span>{new Date(task.created_at).toLocaleDateString('he-IL')}</span>
          </div>
        )}
      </div>
    )
  }

  // Droppable column component
  const DroppableColumn = ({ column, children }) => {
    const {
      setNodeRef,
      isOver,
    } = useSortable({ id: column.id })

    const columnColor = availableColors.find(c => c.name === (column.color || 'gray')) || availableColors[0]

    return (
      <div
        ref={setNodeRef}
        className={`${columnColor.bgClass} rounded-xl p-4 transition-all border-2 ${columnColor.borderClass} ${
          isOver ? 'ring-2 ring-blue-400 shadow-lg' : ''
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className={`font-bold text-lg ${columnColor.textClass}`}>{column.name}</h4>
          <div className="flex items-center gap-2">
            <span className={`${columnColor.bgClass.replace('50', '200')} ${columnColor.textClass} px-2 py-1 rounded-full text-xs font-medium`}>
              {tasks.filter(t => t.column_id === column.id).length}
            </span>
            <button
              onClick={() => handleAddTask(column.id)}
              className={`${columnColor.textClass} hover:opacity-80 p-1 hover:bg-white/50 rounded transition-all`}
              title="הוסף משימה"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {children}
      </div>
    )
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

  const toggleLabel = (labelName) => {
    setTaskForm(prev => {
      const labels = prev.labels || []
      if (labels.includes(labelName)) {
        return { ...prev, labels: labels.filter(l => l !== labelName) }
      } else {
        return { ...prev, labels: [...labels, labelName] }
      }
    })
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowColumnManagementModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit2 size={20} />
                ניהול עמודות
              </button>
              <button
                onClick={() => setShowDepartmentManagementModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit2 size={20} />
                ניהול מחלקות
              </button>
            </div>
          </div>
        </div>

        {/* Department Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            {departments.map(department => (
              <button
                key={department.id}
                onClick={() => setSelectedDepartment(department.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedDepartment === department.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {department.name}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board with Drag and Drop */}
        {selectedDepartment && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <SortableContext
                items={columns.filter(col => col.department_id === selectedDepartment).map(col => col.id)}
              >
                {columns
                  .filter(col => col.department_id === selectedDepartment)
                  .map(column => {
                    const columnTasks = tasks.filter(task => task.column_id === column.id)

                    return (
                      <DroppableColumn key={column.id} column={column}>
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
                      </DroppableColumn>
                    )
                  })}
              </SortableContext>
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

        {/* Department Management Modal */}
        {showDepartmentManagementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">ניהול מחלקות</h3>
                <button
                  onClick={() => setShowDepartmentManagementModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <button
                  onClick={() => {
                    setEditingDepartment(null)
                    setDepartmentForm({ name: '' })
                    setShowDepartmentModal(true)
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={20} />
                  הוסף מחלקה חדשה
                </button>
              </div>

              <div className="space-y-2">
                {departments.map(department => (
                  <div
                    key={department.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{department.name}</h4>
                      <p className="text-sm text-gray-500">
                        {columns.filter(col => col.department_id === department.id).length} עמודות
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingDepartment(department)
                          setDepartmentForm({ name: department.name })
                          setShowDepartmentModal(true)
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        title="ערוך"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {departments.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p>אין מחלקות במערכת</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Column Management Modal */}
        {showColumnManagementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">ניהול עמודות</h3>
                <button
                  onClick={() => setShowColumnManagementModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {selectedDepartment ? (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setEditingColumn(null)
                        setColumnForm({ name: '' })
                        setShowColumnModal(true)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus size={20} />
                      הוסף עמודה חדשה
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      מציג עמודות עבור מחלקה: <strong>{departments.find(d => d.id === selectedDepartment)?.name}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      החלף מחלקה דרך הטאבים למעלה כדי לנהל עמודות אחרות
                    </p>
                  </div>

                  <div className="space-y-2">
                    {columns
                      .filter(col => col.department_id === selectedDepartment)
                      .map(column => (
                        <div
                          key={column.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{column.name}</h4>
                            <p className="text-sm text-gray-500">
                              {tasks.filter(t => t.column_id === column.id).length} משימות
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingColumn(column)
                                setColumnForm({ name: column.name })
                                setShowColumnModal(true)
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                              title="ערוך"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(column.id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                              title="מחק"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    {columns.filter(col => col.department_id === selectedDepartment).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p>אין עמודות במחלקה זו</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>אנא בחר מחלקה תחילה</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Column Modal */}
        {showColumnModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingColumn ? 'ערוך עמודה' : 'הוסף עמודה חדשה'}
                </h3>
                <button
                  onClick={() => setShowColumnModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם העמודה
                  </label>
                  <input
                    type="text"
                    value={columnForm.name}
                    onChange={(e) => setColumnForm({ ...columnForm, name: e.target.value })}
                    placeholder="שם העמודה"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    צבע העמודה
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setColumnForm({ ...columnForm, color: color.name })}
                        className={`${color.bgClass} ${color.borderClass} border-2 p-3 rounded-lg transition-all ${
                          columnForm.color === color.name ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                        }`}
                        title={color.label}
                      >
                        <div className="text-center">
                          <div className={`w-6 h-6 mx-auto mb-1 rounded-full ${color.bgClass.replace('50', '200')}`}></div>
                          <span className="text-xs text-gray-600">{color.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowColumnModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSaveColumn}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Save size={16} />
                  שמור
                </button>
              </div>
            </div>
          </div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag size={16} />
                    תוויות
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableLabels.map(label => {
                      const isSelected = (taskForm.labels || []).includes(label.name)
                      return (
                        <button
                          key={label.name}
                          type="button"
                          onClick={() => toggleLabel(label.name)}
                          className={`${label.color} text-white text-xs px-3 py-1.5 rounded-full transition-all ${
                            isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : 'opacity-50'
                          }`}
                        >
                          {label.name}
                        </button>
                      )
                    })}
                  </div>
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

        {/* Task Detail Modal */}
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedTask.title}
                  </h2>
                  {selectedTask.labels && selectedTask.labels.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedTask.labels.map((label, idx) => {
                        const labelConfig = availableLabels.find(l => l.name === label) || availableLabels[2]
                        return (
                          <span key={idx} className={`${labelConfig.color} text-white text-xs px-3 py-1 rounded-full`}>
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowTaskDetailModal(false)
                      handleEditTask(selectedTask)
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                    title="ערוך משימה"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
                        handleDeleteTask(selectedTask.id)
                        setShowTaskDetailModal(false)
                        setSelectedTask(null)
                        setOrderDetails(null)
                        setTaskItems([])
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                    title="מחק משימה"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setShowTaskDetailModal(false)
                      setSelectedTask(null)
                      setOrderDetails(null)
                      setTaskItems([])
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={28} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Right Side - Task Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">תיאור המשימה</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {selectedTask.description || 'אין תיאור'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">פרטים נוספים</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-gray-600">
                          נוצר: {new Date(selectedTask.created_at).toLocaleString('he-IL')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Move to Department */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <ArrowRight size={18} />
                      העבר למחלקה אחרת
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {departments
                        .filter(dept => dept.id !== selectedTask.department_id)
                        .map(dept => (
                          <button
                            key={dept.id}
                            onClick={() => {
                              handleMoveTaskToDepartment(selectedTask, dept.id)
                              setShowTaskDetailModal(false)
                            }}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                          >
                            {dept.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Left Side - Order Details */}
                {orderDetails && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        פרטי הזמנה #{orderDetails.order_number}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">לקוח: </span>
                          <span className="font-medium">{orderDetails.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">טלפון: </span>
                          <span className="font-medium">{orderDetails.customer_phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">סטטוס: </span>
                          <span className="font-medium">{orderDetails.status}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">סה"כ: </span>
                          <span className="font-medium">₪{orderDetails.total_with_vat?.toFixed(2)}</span>
                        </div>
                        {orderDetails.notes && (
                          <div className="mt-2">
                            <span className="text-gray-600">הערות: </span>
                            <p className="text-gray-800 mt-1">{orderDetails.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items Checklist */}
                    {taskItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                          פריטים להדפסה
                        </h3>
                        <div className="space-y-2">
                          {taskItems.map(item => (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                item.completed
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleTaskItem(item.id)}
                            >
                              <div className="flex-shrink-0">
                                {item.completed ? (
                                  <CheckSquare size={20} className="text-green-600" />
                                ) : (
                                  <Square size={20} className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${
                                  item.completed ? 'line-through text-gray-500' : 'text-gray-800'
                                }`}>
                                  {item.description}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                  <span>כמות: {item.quantity}</span>
                                  <span>מחיר: ₪{item.price?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Progress */}
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>התקדמות</span>
                            <span>
                              {taskItems.filter(i => i.completed).length} / {taskItems.length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${(taskItems.filter(i => i.completed).length / taskItems.length) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!orderDetails && (
                  <div className="flex items-center justify-center text-gray-400">
                    <p>משימה זו אינה מקושרת להזמנה</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
