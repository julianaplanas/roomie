import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateNetBalances, simplifyDebts } from '@/lib/debt'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [members, expenses, allExpenses, settlements, tasks, completions] = await Promise.all([
      prisma.user.findMany({
        where: { householdId: user.householdId },
        select: { id: true, name: true, avatarColor: true },
      }),
      // This month's expenses
      prisma.expense.findMany({
        where: {
          householdId: user.householdId,
          date: { gte: monthStart, lt: monthEnd },
        },
        include: { splits: true },
      }),
      // All expenses for balances
      prisma.expense.findMany({
        where: { householdId: user.householdId },
        include: { splits: { select: { userId: true, amount: true, settled: true } } },
      }),
      prisma.settlement.findMany({
        where: { householdId: user.householdId },
      }),
      // Tasks assigned this month
      prisma.task.findMany({
        where: {
          householdId: user.householdId,
          OR: [
            { dueDate: { gte: monthStart, lt: monthEnd } },
            { createdAt: { gte: monthStart, lt: monthEnd } },
          ],
        },
      }),
      // Completions this month
      prisma.taskCompletion.findMany({
        where: {
          completedAt: { gte: monthStart, lt: monthEnd },
          task: { householdId: user.householdId },
        },
      }),
    ])

    // Total spending this month
    const totalSpending = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    // Category breakdown
    const categoryMap = new Map<string, number>()
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + Number(e.amount))
    }
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, amount]) => ({
      name,
      amount,
    }))

    // Net balances
    const netBalances = calculateNetBalances(
      allExpenses.map((e) => ({
        paidById: e.paidById,
        splits: e.splits.map((s) => ({
          userId: s.userId,
          amount: Number(s.amount),
          settled: s.settled,
        })),
      })),
      settlements.map((s) => ({
        payerId: s.payerId,
        payeeId: s.payeeId,
        amount: Number(s.amount),
      }))
    )
    const simplifiedDebts = simplifyDebts(netBalances)
    const memberMap = new Map(members.map((m) => [m.id, m]))
    const balances = simplifiedDebts.map((d) => ({
      from: memberMap.get(d.from) || { id: d.from, name: 'Unknown' },
      to: memberMap.get(d.to) || { id: d.to, name: 'Unknown' },
      amount: d.amount,
    }))

    // Task stats per member
    const taskStatsMap = new Map<string, { assigned: number; completed: number; overdue: number }>()
    for (const m of members) {
      taskStatsMap.set(m.id, { assigned: 0, completed: 0, overdue: 0 })
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (const t of tasks) {
      const stats = taskStatsMap.get(t.assignedToId)
      if (stats) {
        stats.assigned++
        if (t.dueDate && t.dueDate < todayStart && !t.completedAt && !t.isArchived) {
          stats.overdue++
        }
      }
    }

    for (const c of completions) {
      const stats = taskStatsMap.get(c.completedBy)
      if (stats) {
        stats.completed++
      }
    }

    const taskStats = members.map((m) => {
      const stats = taskStatsMap.get(m.id)!
      const completionRate = stats.assigned > 0 ? stats.completed / stats.assigned : 0
      return {
        member: m,
        assigned: stats.assigned,
        completed: stats.completed,
        overdue: stats.overdue,
        completionRate,
        onARoll: stats.assigned > 0 && completionRate >= 1,
      }
    })

    return NextResponse.json({
      totalSpending,
      categoryBreakdown,
      balances,
      taskStats,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
