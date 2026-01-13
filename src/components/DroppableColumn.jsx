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
            className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-xl transition-all border ${isOver ? 'ring-2 ring-blue-500 bg-[#1A2850]/80 border-blue-500/30' : 'bg-[#131F42]/40 border-slate-700/30'
                }`}
        >
            <div className="p-3 pb-2 flex justify-between items-center cursor-grab active:cursor-grabbing group">
                <h4 className="font-bold text-sm px-2 text-slate-200">{column.name}</h4>
                <div className="flex items-center gap-1">
                    <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full text-xs font-medium">
                        {tasksCount}
                    </span>
                    <button
                        onClick={() => onAddTask(column.id)}
                        className="text-slate-400 hover:text-slate-200 hover:bg-slate-700 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
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
