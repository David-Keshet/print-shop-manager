'use client'

import { Plus } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { availableColors } from '@/app/tasks/board/constants'

export default function DroppableColumn({ column, children, tasksCount, onAddTask }) {
    const {
        setNodeRef,
        isOver,
    } = useSortable({ id: column.id })

    const columnColor = availableColors.find(c => c.name === (column.color || 'gray')) || availableColors[0]

    return (
        <div
            ref={setNodeRef}
            className={`${columnColor.bgClass} rounded-xl p-4 transition-all border-2 ${columnColor.borderClass} ${isOver ? 'ring-2 ring-blue-400 shadow-lg' : ''
                }`}
        >
            <div className="flex justify-between items-center mb-4">
                <h4 className={`font-bold text-lg ${columnColor.textClass}`}>{column.name}</h4>
                <div className="flex items-center gap-2">
                    <span className={`${columnColor.bgClass.replace('50', '200')} ${columnColor.textClass} px-2 py-1 rounded-full text-xs font-medium`}>
                        {tasksCount}
                    </span>
                    <button
                        onClick={() => onAddTask(column.id)}
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
