'use client'

import { Calendar } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { availableLabels } from '@/app/tasks/board/constants'

export default function TaskCard({ task, onViewDetails }) {
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
                    onViewDetails(task)
                }
            }}
            className="group relative bg-[#22272B] hover:bg-[#2C333A] rounded-lg p-3 shadow-sm border border-transparent hover:border-gray-600 cursor-pointer transition-all"
        >
            {/* Edit Button on Hover (optional, keeping clean for now) */}

            <div className="mb-2">
                <h4 className="font-medium text-sm text-gray-100 group-hover:text-white transition-colors">
                    {task.title || 'משימה ללא כותרת'}
                </h4>
            </div>

            {taskLabels.length > 0 && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                    {taskLabels.map((label, idx) => {
                        const labelConfig = availableLabels.find(l => l.name === label) || availableLabels[2]
                        return (
                            <span key={idx} className={`${labelConfig.color} h-2 w-8 rounded-full`} title={label}></span>
                        )
                    })}
                </div>
            )}

            {(task.description || task.orders || task.created_at) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
                    {task.orders && (
                        <span className="flex items-center gap-1 bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded">
                            <span className="opacity-70">#</span>{task.orders.order_number}
                        </span>
                    )}

                    {task.description && (
                        <span title="יש תיאור" className="flex items-center">
                            <span className="text-lg leading-none">≡</span>
                        </span>
                    )}

                    {task.created_at && (
                        <div className="flex items-center gap-1 ml-auto opacity-50">
                            <Calendar size={10} />
                            {/* <span>{new Date(task.created_at).toLocaleDateString()}</span> */}
                            {/* Reduced noise */}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
