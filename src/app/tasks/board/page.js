'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Plus, Edit2, Trash2, X, Save, Calendar, Tag, CheckSquare, Square, ArrowRight, Search } from 'lucide-react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from '@/components/TaskCard'
import DroppableColumn from '@/components/DroppableColumn'
import { availableLabels, availableColors } from './constants'

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
  const [searchQuery, setSearchQuery] = useState('')

  // Ref for horizontal scroll container
  const scrollContainerRef = useRef(null)




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

  // Add horizontal scroll with mouse wheel
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleWheel = (e) => {
      // Check if scrolling vertically
      if (Math.abs(e.deltaY) > 0) {
        // Prevent default vertical scroll
        e.preventDefault()
        // Scroll horizontally instead
        scrollContainer.scrollLeft += e.deltaY
      }
    }

    scrollContainer.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      scrollContainer.removeEventListener('wheel', handleWheel)
    }
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
        // Get target column info to map status
        const targetColumn = columns.find(c => c.id === overId)

        // Update task column
        const { error } = await supabase
          .from('tasks')
          .update({ column_id: overId })
          .eq('id', taskId)

        if (error) throw error

        // Update order status to match column name
        if (task.order_id && targetColumn) {
          // Use column name directly as the status
          const newStatus = targetColumn.name.trim()

          // Update order status
          await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', task.order_id)
        }

        fetchBoardData()
      } catch (error) {
        console.error('שגיאה בהעברת משימה:', error)
      }
    }

    setActiveId(null)
    setDraggedTask(null)
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
      {/* Main Container - Full Height, Dark Theme */}
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white" style={{ direction: 'rtl' }}>

        {/* Sidebar - Departments */}
        <div className="w-64 bg-black/20 backdrop-blur-sm border-l border-white/10 flex flex-col flex-shrink-0 transition-all duration-300">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-lg text-white/90">מחלקות</h2>
            <button
              onClick={() => setShowDepartmentManagementModal(true)}
              className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
              title="ניהול מחלקות"
            >
              <Edit2 size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {departments.map(department => (
              <button
                key={department.id}
                onClick={() => setSelectedDepartment(department.id)}
                className={`w-full text-right px-4 py-2 rounded-lg font-medium transition-all flex justify-between items-center group ${selectedDepartment === department.id
                  ? 'bg-blue-600/80 text-white shadow-lg backdrop-blur-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span>{department.name}</span>
                {selectedDepartment === department.id && (
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                )}
              </button>
            ))}
            <button
              onClick={() => {
                setEditingDepartment(null)
                setDepartmentForm({ name: '' })
                setShowDepartmentModal(true)
              }}
              className="w-full mt-4 text-right px-4 py-2 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white border border-dashed border-white/20 hover:border-white/40 flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              <span>הוסף מחלקה</span>
            </button>
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Board Header */}
          <div className="h-14 bg-black/10 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{departments.find(d => d.id === selectedDepartment)?.name || 'לוח משימות'}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש משימות..."
                  className="pl-3 pr-10 py-1.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/50 rounded text-sm transition-colors backdrop-blur-sm border border-white/10 focus:border-white/30 focus:outline-none w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowColumnManagementModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors backdrop-blur-sm"
              >
                <Edit2 size={14} />
                <span>ניהול עמודות</span>
              </button>
            </div>
          </div>

          {/* Columns Container - Horizontal Scroll */}
          <div ref={scrollContainerRef} className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex items-start p-6 gap-6 min-w-max">
              {selectedDepartment && (
                <>
                  {/* Show search results if there's a search query */}
                  {searchQuery.trim() ? (
                    <div className="w-full">
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                          <Search size={20} />
                          תוצאות חיפוש עבור: "{searchQuery}"
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tasks.filter(task => {
                            const query = searchQuery.toLowerCase()

                            // Search in task title
                            if (task.title?.toLowerCase().includes(query)) return true

                            // Search in task description
                            if (task.description?.toLowerCase().includes(query)) return true

                            // Search in order number
                            if (task.orders?.order_number?.toString().includes(query)) return true

                            // Search in customer name
                            if (task.orders?.customer_name?.toLowerCase().includes(query)) return true

                            // Search in customer phone
                            if (task.orders?.customer_phone?.includes(query)) return true

                            return false
                          }).map(task => {
                            const taskColumn = columns.find(c => c.id === task.column_id)
                            const taskDepartment = departments.find(d => d.id === task.department_id)

                            return (
                              <TaskCard
                                key={task.id}
                                task={{
                                  ...task,
                                  // Add department/column info badge in search results
                                  _searchMeta: {
                                    department: taskDepartment?.name,
                                    column: taskColumn?.name
                                  }
                                }}
                                onViewDetails={handleViewTaskDetails}
                              />
                            )
                          })}
                        </div>
                        {tasks.filter(task => {
                          const query = searchQuery.toLowerCase()
                          return task.title?.toLowerCase().includes(query) ||
                            task.description?.toLowerCase().includes(query) ||
                            task.orders?.order_number?.toString().includes(query) ||
                            task.orders?.customer_name?.toLowerCase().includes(query) ||
                            task.orders?.customer_phone?.includes(query)
                        }).length === 0 && (
                            <div className="text-center py-8 text-white/50">
                              <p>לא נמצאו תוצאות</p>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    /* Normal column view when no search */
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCorners}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={columns.filter(col => col.department_id === selectedDepartment).map(col => col.id)}
                      >
                        {columns
                          .filter(col => col.department_id === selectedDepartment)
                          .map(column => {
                            const columnTasks = tasks.filter(task => task.column_id === column.id)

                            return (
                              <DroppableColumn
                                key={column.id}
                                column={column}
                                tasksCount={tasks.filter(t => t.column_id === column.id).length}
                                onAddTask={handleAddTask}
                              >
                                <SortableContext
                                  items={columnTasks.map(task => task.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="min-h-[100px] flex flex-col gap-2">
                                    {columnTasks.map(task => (
                                      <TaskCard
                                        key={task.id}
                                        task={task}
                                        onViewDetails={handleViewTaskDetails}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DroppableColumn>
                            )
                          })}
                      </SortableContext>

                      {/* Add Column Button inside the board flow */}
                      <div className="w-80 flex-shrink-0">
                        <button
                          onClick={() => {
                            if (!selectedDepartment) return;
                            setEditingColumn(null)
                            setColumnForm({ name: '', color: 'gray' })
                            setShowColumnModal(true)
                          }}
                          className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 px-4 transition-colors backdrop-blur-sm"
                        >
                          <Plus size={20} />
                          <span>הוסף עמודה אחרת</span>
                        </button>
                      </div>

                      <DragOverlay>
                        {activeId && draggedTask ? (
                          <div className="bg-gray-800 rounded-lg p-3 shadow-2xl border border-gray-600 w-72 rotate-3">
                            <h4 className="font-medium text-sm text-white">
                              {draggedTask.title || 'משימה ללא כותרת'}
                            </h4>
                            {draggedTask.description && (
                              <p className="text-xs text-gray-400 mt-1">{draggedTask.description}</p>
                            )}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modals - Keeping existing logic but updating styles slightly if needed, or just keeping them generic */}
        {/* Department Management Modal */}
        {showDepartmentManagementModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
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
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="ערוך"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="מחק"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Column Management Modal */}
        {showColumnManagementModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
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
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Plus size={20} />
                      הוסף עמודה חדשה
                    </button>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      מציג עמודות עבור מחלקה: <strong>{departments.find(d => d.id === selectedDepartment)?.name}</strong>
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
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                              title="ערוך"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(column.id)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              title="מחק"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
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

        {/* Column Modal - Add/Edit */}
        {showColumnModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
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
                        className={`w-full aspect-square rounded-lg transition-all ${columnForm.color === color.name ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                          }`}
                        title={color.label}
                      >
                        <div className={`w-full h-full rounded-lg ${color.bgClass.replace('50', '200')}`}></div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveColumn}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  שמור עמודה
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Department Form Modal */}
        {showDepartmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שם המחלקה
                  </label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    placeholder="שם המחלקה"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSaveDepartment}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  שמור
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Modal - Create/Edit */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingTask ? 'עריכת משימה' : 'משימה חדשה'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    בעמודה: {columns.find(c => c.id === taskForm.column_id)?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-lg"
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
                    placeholder="מה צריך לעשות?"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תיאור / הערות
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="פרטים נוספים..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תגיות
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableLabels.map(label => (
                      <button
                        key={label.name}
                        onClick={() => toggleLabel(label.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${(taskForm.labels || []).includes(label.name)
                          ? `${label.color} text-white border-transparent`
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        {(taskForm.labels || []).includes(label.name) && <CheckSquare size={12} />}
                        {label.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleSaveTask}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
                  >
                    {editingTask ? 'שמור שינויים' : 'צור משימה'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Task Detail Modal - גדול מאוד */}
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-2">
            <div className="bg-white rounded-2xl w-full max-w-[95vw] shadow-2xl h-[96vh] overflow-hidden flex flex-col">

              {/* Header: Order Number - Name - Phone - קטן יותר */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 border-b-4 border-blue-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {orderDetails && (
                        <span className="text-2xl font-bold">
                          #{orderDetails.order_number}
                        </span>
                      )}
                      <span className="text-white/60">•</span>
                      <h2 className="text-xl font-bold">
                        {orderDetails?.customer_name || selectedTask.title || 'משימה'}
                      </h2>
                    </div>
                    {orderDetails?.customer_phone && (
                      <div className="text-sm text-blue-100">
                        📞 {orderDetails.customer_phone}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowTaskDetailModal(false)
                        handleEditTask(selectedTask)
                      }}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
                      title="ערוך"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('למחוק את המשימה?')) {
                          handleDeleteTask(selectedTask.id)
                          setShowTaskDetailModal(false)
                        }
                      }}
                      className="p-2 text-white/80 hover:text-white hover:bg-red-500/30 rounded-xl transition-colors"
                      title="מחק"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button
                      onClick={() => setShowTaskDetailModal(false)}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar - קו אחוזים */}
              {taskItems.length > 0 && (
                <div className="bg-gray-100 px-8 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">התקדמות</span>
                    <span className="text-sm font-bold text-blue-600">
                      {Math.round((taskItems.filter(i => i.completed).length / taskItems.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(taskItems.filter(i => i.completed).length / taskItems.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Content - Main section with order items */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex gap-6 p-8">

                  {/* Main Content Area - Order Items (70%) */}
                  <div className="flex-1">
                    {taskItems.length > 0 ? (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                          <span>📋</span>
                          פריטים להכנה
                          <span className="text-lg font-normal text-gray-400">
                            ({taskItems.filter(i => i.completed).length}/{taskItems.length})
                          </span>
                        </h3>
                        <div className="space-y-3">
                          {taskItems.map(item => (
                            <div
                              key={item.id}
                              onClick={() => toggleTaskItem(item.id)}
                              className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer border-2 transition-all shadow-sm hover:shadow-md ${
                                item.completed
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-white border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center mt-1 flex-shrink-0 transition-colors ${
                                item.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 text-transparent'
                              }`}>
                                <CheckSquare size={18} />
                              </div>
                              <div className="flex-1">
                                <p className={`text-lg font-semibold mb-1 ${item.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                                  {item.description || `פריט #${item.id}`}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">כמות:</span> {item.quantity} יח'
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">מידות:</span> {item.width} × {item.height} ס"מ
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <p className="text-xl">אין פריטים להצגה</p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar - Details (30%) */}
                  <div className="w-64 space-y-4 flex-shrink-0">

                    {/* Labels - תוויות */}
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                      <h4 className="text-purple-800 mb-3 text-sm font-bold flex items-center gap-1">
                        <Tag size={14} /> תוויות
                      </h4>

                      {/* Current Labels */}
                      {selectedTask.labels && selectedTask.labels.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedTask.labels.map((label, idx) => {
                            const labelConfig = availableLabels.find(l => l.name === label) || availableLabels[2]
                            return (
                              <span
                                key={idx}
                                className={`${labelConfig.color} text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1`}
                              >
                                {label}
                                <button
                                  onClick={() => {
                                    const newLabels = selectedTask.labels.filter((_, i) => i !== idx)
                                    supabase
                                      .from('tasks')
                                      .update({ labels: newLabels })
                                      .eq('id', selectedTask.id)
                                      .then(() => {
                                        setSelectedTask({ ...selectedTask, labels: newLabels })
                                        fetchBoardData()
                                      })
                                  }}
                                  className="hover:bg-white/30 rounded-full p-0.5"
                                  title="הסר תווית"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-xs mb-3">אין תוויות</div>
                      )}

                      {/* Add Label Dropdown */}
                      <div className="space-y-2">
                        <label className="block text-purple-800 text-xs font-semibold">הוסף תווית:</label>
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return
                            const currentLabels = selectedTask.labels || []
                            if (currentLabels.includes(e.target.value)) {
                              alert('תווית זו כבר קיימת')
                              e.target.value = ''
                              return
                            }
                            const newLabels = [...currentLabels, e.target.value]
                            supabase
                              .from('tasks')
                              .update({ labels: newLabels })
                              .eq('id', selectedTask.id)
                              .then(() => {
                                setSelectedTask({ ...selectedTask, labels: newLabels })
                                fetchBoardData()
                                e.target.value = ''
                              })
                          }}
                          className="w-full px-2 py-1.5 border border-purple-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs"
                          defaultValue=""
                        >
                          <option value="">בחר תווית להוספה...</option>
                          {availableLabels.map((label, idx) => (
                            <option key={idx} value={label.name}>
                              {label.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Date - תאריך */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="text-blue-800 mb-2 text-sm font-bold flex items-center gap-1">
                        <Calendar size={14} /> תאריך
                      </h4>
                      <div className="text-gray-700 text-sm">
                        {new Date(selectedTask.created_at).toLocaleDateString('he-IL', {
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Description - פרטים */}
                    {selectedTask.description && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 className="text-gray-800 mb-2 text-sm font-bold flex items-center gap-1">
                          <span className="text-base">≡</span> פרטים
                        </h4>
                        <div className="text-gray-600 text-xs whitespace-pre-wrap leading-relaxed">
                          {selectedTask.description}
                        </div>
                      </div>
                    )}

                    {/* Move to Department/Column - העבר כרטיס */}
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <h4 className="text-amber-800 mb-3 text-sm font-bold flex items-center gap-1">
                        <ArrowRight size={14} /> העבר כרטיס
                      </h4>

                      {/* Select Department */}
                      <div className="mb-3">
                        <label className="block text-amber-800 text-xs font-semibold mb-1">מחלקה:</label>
                        <select
                          id="move-department-select"
                          onChange={(e) => {
                            const columnSelect = document.getElementById('move-column-select')
                            if (columnSelect) {
                              columnSelect.value = ''
                              columnSelect.disabled = !e.target.value
                            }
                          }}
                          className="w-full px-2 py-1.5 border border-amber-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                          defaultValue=""
                        >
                          <option value="">בחר מחלקה...</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Select Column */}
                      <div className="mb-3">
                        <label className="block text-amber-800 text-xs font-semibold mb-1">עמודה:</label>
                        <select
                          id="move-column-select"
                          disabled
                          className="w-full px-2 py-1.5 border border-amber-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                          defaultValue=""
                        >
                          <option value="">בחר עמודה...</option>
                          {(() => {
                            const deptSelect = document.getElementById('move-department-select')
                            const selectedDeptId = deptSelect ? parseInt(deptSelect.value) : null
                            if (!selectedDeptId) return null
                            return columns
                              .filter(col => col.department_id === selectedDeptId)
                              .map(col => (
                                <option key={col.id} value={col.id}>
                                  {col.name}
                                </option>
                              ))
                          })()}
                        </select>
                      </div>

                      {/* Move Button */}
                      <button
                        onClick={() => {
                          const deptSelect = document.getElementById('move-department-select')
                          const colSelect = document.getElementById('move-column-select')
                          const selectedDeptId = deptSelect ? parseInt(deptSelect.value) : null
                          const selectedColId = colSelect ? parseInt(colSelect.value) : null

                          if (!selectedDeptId || !selectedColId) {
                            alert('יש לבחור גם מחלקה וגם עמודה')
                            return
                          }

                          // Update task
                          supabase
                            .from('tasks')
                            .update({
                              department_id: selectedDeptId,
                              column_id: selectedColId
                            })
                            .eq('id', selectedTask.id)
                            .then(() => {
                              setShowTaskDetailModal(false)
                              fetchBoardData()
                            })
                        }}
                        className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        העבר
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

