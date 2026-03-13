'use client'

import { formatDateShort, isOverdue, getInitials, cn } from '@/lib/utils'

interface TaskCardProps {
  task: {
    id: string
    title: string
    type: string
    frequency?: string | null
    dueDate?: string | null
    completedAt?: string | null
    assignedTo: { id: string; name: string; avatarColor: string }
  }
  onComplete: () => void
  onDelete: () => void
}

export default function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const overdue = task.dueDate && !task.completedAt && isOverdue(task.dueDate)
  const completed = !!task.completedAt

  return (
    <div className={cn(
      'card flex items-center gap-3',
      overdue && 'border-l-4 border-l-red-400',
      completed && 'opacity-60'
    )}>
      <button
        onClick={onComplete}
        disabled={completed}
        className={cn(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
          completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
        )}
      >
        {completed && '✓'}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-sm',
          completed ? 'line-through text-muted' : 'text-foreground'
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.type === 'recurring' && task.frequency && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
              {task.frequency}
            </span>
          )}
          {task.dueDate && (
            <span className={cn(
              'text-xs',
              overdue ? 'text-red-500 font-medium' : 'text-muted'
            )}>
              {overdue ? 'Overdue • ' : ''}{formatDateShort(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ backgroundColor: task.assignedTo.avatarColor }}
          title={task.assignedTo.name}
        >
          {getInitials(task.assignedTo.name)}
        </div>
        <button
          onClick={onDelete}
          className="text-gray-400 hover:text-red-500 text-sm p-1"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
