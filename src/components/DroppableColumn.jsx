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
            className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-xl transition-all ${isOver ? 'ring-2 ring-blue-400 bg-black/50' : 'bg-black/20'
                } backdrop-blur-sm`}
        >
            <div className="p-3 pb-2 flex justify-between items-center text-white cursor-grab active:cursor-grabbing">
                <h4 className="font-bold text-sm px-2">{column.name}</h4>
                <div className="flex items-center gap-1">
                    <span className="bg-white/10 text-white/80 px-2 py-0.5 rounded-full text-xs font-medium">
                        {tasksCount}
                    </span>
                    <button
                        onClick={() => onAddTask(column.id)}
                        className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-all"
                        title="הוסף משימה"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2 custom-scrollbar">
                {children}
            </div>
        </div>
    )
}
