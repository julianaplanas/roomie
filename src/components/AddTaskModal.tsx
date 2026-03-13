'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { FREQUENCIES } from '@/lib/constants'
import Modal from './Modal'

interface Member {
  id: string
  name: string
}

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

export default function AddTaskModal({ isOpen, onClose, onAdded }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'one_time' | 'recurring'>('one_time')
  const [frequency, setFrequency] = useState('weekly')
  const [assignedToId, setAssignedToId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      api.get<{ members: Member[] }>('/api/household/members').then((res) => {
        setMembers(res.members)
        if (res.members.length > 0 && !assignedToId) {
          setAssignedToId(res.members[0].id)
        }
      })
    }
  }, [isOpen, assignedToId])

  const resetForm = () => {
    setTitle('')
    setType('one_time')
    setFrequency('weekly')
    setDueDate('')
    setAssignedToId(members[0]?.id || '')
  }

  const handleSubmit = async () => {
    if (!title || !assignedToId) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/tasks', {
        title,
        type,
        frequency: type === 'recurring' ? frequency : undefined,
        assignedToId,
        dueDate: dueDate || undefined,
      })
      toast.success('Task added!')
      resetForm()
      onAdded()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Task">
      <div className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="e.g. Take out the trash"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('one_time')}
              className={`flex-1 py-2 rounded-2xl text-sm font-medium transition-all ${
                type === 'one_time'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              One-time
            </button>
            <button
              type="button"
              onClick={() => setType('recurring')}
              className={`flex-1 py-2 rounded-2xl text-sm font-medium transition-all ${
                type === 'recurring'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Recurring
            </button>
          </div>
        </div>

        {type === 'recurring' && (
          <div>
            <label className="label">Frequency</label>
            <select
              className="input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Assign to</label>
          <select
            className="input"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Due date {type === 'one_time' && '(optional)'}</label>
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add task'}
        </button>
      </div>
    </Modal>
  )
}
