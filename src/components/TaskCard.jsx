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
            {/* Search Meta Info (shown only in search results) */}
            {task._searchMeta && (
                <div className="flex gap-1.5 mb-2 flex-wrap">
                    <span className="bg-purple-600/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {task._searchMeta.department}
                    </span>
                    <span className="bg-blue-600/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {task._searchMeta.column}
                    </span>
                </div>
            )}

            {/* Header: Order Number - Name - Phone (כמו בכרטיס פתוח) */}
            <div className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                    {task.orders && (
                        <>
                            <span className="text-blue-400 font-bold text-base">
                                #{task.orders.order_number}
                            </span>
                            <span className="text-gray-500">•</span>
                        </>
                    )}
                    <h4 className="font-semibold text-sm text-gray-100 group-hover:text-white transition-colors flex-1">
                        {task.orders?.customer_name || task.title || 'משימה ללא כותרת'}
                    </h4>
                </div>
                {task.orders?.customer_phone && (
                    <div className="text-xs text-gray-400">
                        📞 {task.orders.customer_phone}
                    </div>
                )}
            </div>

            {/* Labels */}
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

            {/* Additional info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-2">
                {task.description && (
                    <span title="יש תיאור" className="flex items-center">
                        <span className="text-base leading-none">≡</span>
                    </span>
                )}
                {task.created_at && (
                    <div className="flex items-center gap-1 ml-auto opacity-50">
                        <Calendar size={10} />
                    </div>
                )}
            </div>
        </div>
    )
}
