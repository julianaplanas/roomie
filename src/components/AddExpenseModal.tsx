'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { CATEGORIES } from '@/lib/constants'
import Modal from './Modal'

interface Member {
  id: string
  name: string
  avatarColor: string
}

interface AddExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded: () => void
}

export default function AddExpenseModal({ isOpen, onClose, onAdded }: AddExpenseModalProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidById, setPaidById] = useState('')
  const [splitBetween, setSplitBetween] = useState<string[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      api.get<{ members: Member[] }>('/api/household/members').then((res) => {
        setMembers(res.members)
        if (res.members.length > 0 && !paidById) {
          setPaidById(res.members[0].id)
          setSplitBetween(res.members.map((m) => m.id))
        }
      })
    }
  }, [isOpen, paidById])

  const resetForm = () => {
    setTitle('')
    setAmount('')
    setCategory('Food')
    setDate(new Date().toISOString().split('T')[0])
    setPaidById(members[0]?.id || '')
    setSplitBetween(members.map((m) => m.id))
  }

  const handleSubmit = async () => {
    if (!title || !amount || !paidById || splitBetween.length === 0) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/expenses', {
        title,
        amount: parseFloat(amount),
        category,
        date,
        paidById,
        splitBetween,
      })
      toast.success('Expense added!')
      resetForm()
      onAdded()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSplit = (id: string) => {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense">
      <div className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="e.g. Groceries"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Amount (EUR)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setCategory(cat.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat.name
                    ? 'text-white shadow-sm scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={category === cat.name ? { backgroundColor: cat.color } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Paid by</label>
          <select
            className="input"
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Split between</label>
          <div className="space-y-2">
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={splitBetween.includes(m.id)}
                  onChange={() => toggleSplit(m.id)}
                  className="w-5 h-5 rounded-lg text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-foreground">{m.name}</span>
              </label>
            ))}
          </div>
          {splitBetween.length > 0 && amount && (
            <p className="text-xs text-muted mt-2">
              {(parseFloat(amount) / splitBetween.length).toFixed(2)} EUR per person
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add expense'}
        </button>
      </div>
    </Modal>
  )
}
