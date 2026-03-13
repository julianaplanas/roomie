'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import ExpenseCard from '@/components/ExpenseCard'
import AddExpenseModal from '@/components/AddExpenseModal'
import SettleModal from '@/components/SettleModal'
import { useAuthContext } from '@/components/AuthProvider'

interface Expense {
  id: string
  title: string
  amount: number
  category: string
  date: string
  paidBy: { id: string; name: string; avatarColor: string }
  splits: Array<{ userId: string; amount: number; user: { id: string; name: string } }>
}

interface Balance {
  from: { id: string; name: string }
  to: { id: string; name: string }
  amount: number
}

export default function ExpensesPage() {
  const { user } = useAuthContext()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Balance | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [expRes, balRes] = await Promise.all([
        api.get<{ expenses: Expense[] }>('/api/expenses'),
        api.get<{ balances: Balance[] }>('/api/expenses/balances'),
      ])
      setExpenses(expRes.expenses)
      setBalances(balRes.balances)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSettleClick = (debt: Balance) => {
    setSelectedDebt(debt)
    setShowSettle(true)
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Expenses</h1>

      {/* Balances */}
      {balances.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-foreground mb-3">Balances</h2>
          <div className="space-y-3">
            {balances.map((b, i) => {
              const isMe = b.from.id === user?.id || b.to.id === user?.id
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{b.from.id === user?.id ? 'You' : b.from.name}</span>
                    <span className="text-muted"> owes </span>
                    <span className="font-medium">{b.to.id === user?.id ? 'you' : b.to.name}</span>
                    <span className="font-bold ml-1.5">{formatCurrency(b.amount)}</span>
                  </div>
                  {isMe && (
                    <button
                      onClick={() => handleSettleClick(b)}
                      className="text-xs text-primary-600 font-semibold hover:underline"
                    >
                      Settle
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expenses list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">💸</div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No expenses yet</h2>
          <p className="text-sm text-muted mb-4">Add your first shared expense to get started!</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            Add expense
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onClick={() => setSelectedExpense(expense)}
            />
          ))}
        </div>
      )}

      {/* Expense detail modal */}
      {selectedExpense && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedExpense(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedExpense.title}</h2>
              <button
                onClick={() => setSelectedExpense(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>
            <p className="text-2xl font-bold text-primary-600 mb-3">
              {formatCurrency(Number(selectedExpense.amount))}
            </p>
            <p className="text-sm text-muted mb-1">Paid by {selectedExpense.paidBy.name}</p>
            <p className="text-sm text-muted mb-4">
              Split between: {selectedExpense.splits.map((s) => s.user.name).join(', ')}
            </p>
            <div className="space-y-1">
              {selectedExpense.splits.map((s) => (
                <div key={s.userId} className="flex justify-between text-sm">
                  <span>{s.user.name}</span>
                  <span className="font-medium">{formatCurrency(Number(s.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} className="fab">+</button>

      <AddExpenseModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={fetchData}
      />

      <SettleModal
        isOpen={showSettle}
        onClose={() => setShowSettle(false)}
        onSettled={fetchData}
        debt={selectedDebt}
      />
    </div>
  )
}
