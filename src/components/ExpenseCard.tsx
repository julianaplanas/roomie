'use client'

import { formatCurrency, formatDateShort, getInitials } from '@/lib/utils'
import { getCategoryColor } from '@/lib/constants'

interface ExpenseCardProps {
  expense: {
    id: string
    title: string
    amount: number | string
    category: string
    date: string
    paidBy: { id: string; name: string; avatarColor: string }
  }
  onClick?: () => void
}

export default function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  return (
    <button
      onClick={onClick}
      className="card w-full text-left hover:shadow-card-hover transition-shadow flex items-center gap-3"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
        style={{ backgroundColor: expense.paidBy.avatarColor }}
      >
        {getInitials(expense.paidBy.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-foreground text-sm truncate">{expense.title}</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white shrink-0"
            style={{ backgroundColor: getCategoryColor(expense.category) }}
          >
            {expense.category}
          </span>
        </div>
        <p className="text-xs text-muted">
          {expense.paidBy.name} • {formatDateShort(expense.date)}
        </p>
      </div>
      <p className="text-sm font-bold text-foreground shrink-0">
        {formatCurrency(Number(expense.amount))}
      </p>
    </button>
  )
}
