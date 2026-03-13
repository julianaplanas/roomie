'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import { getCategoryColor } from '@/lib/constants'
import { useAuthContext } from '@/components/AuthProvider'

interface StatsData {
  totalSpending: number
  categoryBreakdown: Array<{ name: string; amount: number }>
  balances: Array<{
    from: { id: string; name: string }
    to: { id: string; name: string }
    amount: number
  }>
  taskStats: Array<{
    member: { id: string; name: string; avatarColor: string }
    assigned: number
    completed: number
    overdue: number
    completionRate: number
    onARoll: boolean
  }>
}

export default function StatsPage() {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<StatsData>('/api/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Stats</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="page-container">
        <h1 className="page-title">Stats</h1>
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📊</div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No data yet</h2>
          <p className="text-sm text-muted">Start adding expenses and tasks to see your stats!</p>
        </div>
      </div>
    )
  }

  const maxCategory = Math.max(...stats.categoryBreakdown.map((c) => c.amount), 1)

  return (
    <div className="page-container">
      <h1 className="page-title">Stats</h1>

      {/* Monthly spending */}
      <div className="card mb-4">
        <h2 className="font-semibold text-foreground mb-1">This Month</h2>
        <p className="text-3xl font-bold text-primary-600">
          {formatCurrency(stats.totalSpending)}
        </p>
        <p className="text-xs text-muted">total household spending</p>
      </div>

      {/* Category breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-foreground mb-3">By Category</h2>
          <div className="space-y-3">
            {stats.categoryBreakdown
              .sort((a, b) => b.amount - a.amount)
              .map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(cat.amount / maxCategory) * 100}%`,
                        backgroundColor: getCategoryColor(cat.name),
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Balances */}
      {stats.balances.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-foreground mb-3">Balances</h2>
          <div className="space-y-2">
            {stats.balances.map((b, i) => (
              <p key={i} className="text-sm">
                <span className="font-medium">
                  {b.from.id === user?.id ? 'You' : b.from.name}
                </span>
                <span className="text-muted"> owes </span>
                <span className="font-medium">
                  {b.to.id === user?.id ? 'you' : b.to.name}
                </span>
                <span className="font-bold ml-1">{formatCurrency(b.amount)}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Task completion */}
      {stats.taskStats.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-foreground mb-3">Task Completion</h2>
          <div className="space-y-4">
            {stats.taskStats.map((ts) => (
              <div key={ts.member.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: ts.member.avatarColor }}
                  >
                    {getInitials(ts.member.name)}
                  </div>
                  <span className="text-sm font-medium flex-1">{ts.member.name}</span>
                  <span className="text-xs text-muted">
                    {ts.completed}/{ts.assigned} tasks
                  </span>
                  {ts.onARoll && <span className="text-sm" title="100% completion!">🔥</span>}
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      ts.completionRate >= 1 ? 'bg-green-500' :
                      ts.completionRate >= 0.5 ? 'bg-primary-500' : 'bg-orange-400'
                    )}
                    style={{ width: `${Math.min(ts.completionRate * 100, 100)}%` }}
                  />
                </div>
                {ts.overdue > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    {ts.overdue} overdue
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
