'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import Modal from './Modal'

interface Balance {
  from: { id: string; name: string }
  to: { id: string; name: string }
  amount: number
}

interface SettleModalProps {
  isOpen: boolean
  onClose: () => void
  onSettled: () => void
  debt: Balance | null
}

export default function SettleModal({ isOpen, onClose, onSettled, debt }: SettleModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (!debt) return null

  const handleSettle = async () => {
    setLoading(true)
    try {
      await api.post('/api/expenses/settle', {
        payerId: debt.from.id,
        payeeId: debt.to.id,
        amount: debt.amount,
        note: note || undefined,
      })
      toast.success('Debt settled!')
      setNote('')
      onSettled()
      onClose()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle debt">
      <div className="space-y-4">
        <div className="card bg-primary-50 text-center">
          <p className="text-sm text-muted mb-1">
            <span className="font-semibold text-foreground">{debt.from.name}</span> pays
          </p>
          <p className="text-3xl font-bold text-primary-600">{formatCurrency(debt.amount)}</p>
          <p className="text-sm text-muted mt-1">
            to <span className="font-semibold text-foreground">{debt.to.name}</span>
          </p>
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <input
            className="input"
            placeholder="e.g. Venmo transfer"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          onClick={handleSettle}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Settling...' : 'Mark as settled'}
        </button>
      </div>
    </Modal>
  )
}
