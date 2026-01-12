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
