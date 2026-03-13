'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/components/AuthProvider'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface Balance {
  from: { id: string; name: string }
  to: { id: string; name: string }
  amount: number
}

interface TaskSummary {
  overdue: number
  dueToday: number
  myPending: number
}

export default function HomePage() {
  const { user } = useAuthContext()
  const [balances, setBalances] = useState<Balance[]>([])
  const [tasks, setTasks] = useState<TaskSummary>({ overdue: 0, dueToday: 0, myPending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [balRes, taskRes] = await Promise.all([
          api.get<{ balances: Balance[] }>('/api/expenses/balances').catch(() => ({ balances: [] })),
          api.get<TaskSummary>('/api/tasks/summary').catch(() => ({ overdue: 0, dueToday: 0, myPending: 0 })),
        ])
        setBalances(balRes.balances || [])
        setTasks(taskRes)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const myDebts = balances.filter((b) => b.from.id === user?.id)
  const owedToMe = balances.filter((b) => b.to.id === user?.id)

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted text-sm">{user?.household?.name}</p>
      </div>

      {/* Balance Summary */}
      <div className="card mb-4">
        <h2 className="font-semibold text-foreground mb-3">Balance Summary</h2>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-6 w-1/2" />
          </div>
        ) : balances.length === 0 ? (
          <p className="text-sm text-muted">All settled up! 🎉</p>
        ) : (
          <div className="space-y-2">
            {myDebts.map((b, i) => (
              <p key={i} className="text-sm">
                <span className="text-red-500 font-medium">You owe</span>{' '}
                <span className="font-semibold">{b.to.name}</span>{' '}
                <span className="text-red-500 font-bold">{formatCurrency(b.amount)}</span>
              </p>
            ))}
            {owedToMe.map((b, i) => (
              <p key={i} className="text-sm">
                <span className="font-semibold">{b.from.name}</span>{' '}
                <span className="text-green-600 font-medium">owes you</span>{' '}
                <span className="text-green-600 font-bold">{formatCurrency(b.amount)}</span>
              </p>
            ))}
            {myDebts.length === 0 && owedToMe.length === 0 && (
              <p className="text-sm text-muted">All settled up! 🎉</p>
            )}
          </div>
        )}
      </div>

      {/* Tasks Summary */}
      <div className="card mb-4">
        <h2 className="font-semibold text-foreground mb-3">Tasks</h2>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-6 w-2/3" />
          </div>
        ) : (
          <div className="space-y-1.5">
            {tasks.overdue > 0 && (
              <p className="text-sm text-red-500 font-medium">
                ⚠️ {tasks.overdue} overdue task{tasks.overdue > 1 ? 's' : ''}
              </p>
            )}
            {tasks.dueToday > 0 && (
              <p className="text-sm text-warning font-medium">
                📋 {tasks.dueToday} task{tasks.dueToday > 1 ? 's' : ''} due today
              </p>
            )}
            {tasks.myPending > 0 && (
              <p className="text-sm text-muted">
                You have {tasks.myPending} pending task{tasks.myPending > 1 ? 's' : ''}
              </p>
            )}
            {tasks.overdue === 0 && tasks.dueToday === 0 && tasks.myPending === 0 && (
              <p className="text-sm text-muted">No pending tasks! ✨</p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/expenses" className="card text-center hover:shadow-card-hover transition-shadow">
          <span className="text-2xl mb-1 block">💰</span>
          <span className="text-sm font-medium text-foreground">Add expense</span>
        </Link>
        <Link href="/tasks" className="card text-center hover:shadow-card-hover transition-shadow">
          <span className="text-2xl mb-1 block">✅</span>
          <span className="text-sm font-medium text-foreground">Add task</span>
        </Link>
      </div>
    </div>
  )
}
