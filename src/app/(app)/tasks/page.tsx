'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { cn, isOverdue } from '@/lib/utils'
import { useAuthContext } from '@/components/AuthProvider'
import TaskCard from '@/components/TaskCard'
import AddTaskModal from '@/components/AddTaskModal'

interface Task {
  id: string
  title: string
  type: string
  frequency?: string | null
  dueDate?: string | null
  completedAt?: string | null
  assignedTo: { id: string; name: string; avatarColor: string }
}

type Filter = 'all' | 'mine' | 'overdue'

export default function TasksPage() {
  const { user } = useAuthContext()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get<{ tasks: Task[] }>('/api/tasks')
      setTasks(res.tasks)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const handleComplete = async (taskId: string) => {
    try {
      await api.post(`/api/tasks/${taskId}/complete`)
      toast.success('Task completed!')
      fetchTasks()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/api/tasks/${taskId}`)
      toast.success('Task deleted')
      fetchTasks()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  const pendingTasks = tasks.filter((t) => !t.completedAt)
  const completedTasks = tasks.filter((t) => t.completedAt && t.type === 'one_time')

  const filteredTasks = pendingTasks.filter((t) => {
    if (filter === 'mine') return t.assignedTo.id === user?.id
    if (filter === 'overdue') return t.dueDate && isOverdue(t.dueDate)
    return true
  })

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine' },
    { key: 'overdue', label: 'Overdue' },
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">Tasks</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : filteredTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h2>
          <p className="text-sm text-muted mb-4">Add tasks to keep your household organized!</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            Add task
          </button>
        </div>
      ) : (
        <>
          {filteredTasks.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">
              {filter === 'mine' ? 'No tasks assigned to you' :
               filter === 'overdue' ? 'No overdue tasks! 🎉' :
               'No pending tasks'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleComplete(task.id)}
                  onDelete={() => handleDelete(task.id)}
                />
              ))}
            </div>
          )}

          {/* Completed section */}
          {completedTasks.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowDone(!showDone)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-3"
              >
                <span className="transform transition-transform" style={{
                  display: 'inline-block',
                  transform: showDone ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>
                  ▶
                </span>
                Done ({completedTasks.length})
              </button>
              {showDone && (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={() => {}}
                      onDelete={() => handleDelete(task.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} className="fab">+</button>

      <AddTaskModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={fetchTasks}
      />
    </div>
  )
}
