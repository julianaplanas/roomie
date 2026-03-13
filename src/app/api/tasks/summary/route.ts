import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const [overdue, dueToday, myPending] = await Promise.all([
      prisma.task.count({
        where: {
          householdId: user.householdId,
          isArchived: false,
          completedAt: null,
          dueDate: { lt: todayStart },
        },
      }),
      prisma.task.count({
        where: {
          householdId: user.householdId,
          isArchived: false,
          completedAt: null,
          dueDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.task.count({
        where: {
          householdId: user.householdId,
          isArchived: false,
          completedAt: null,
          assignedToId: user.id,
        },
      }),
    ])

    return NextResponse.json({ overdue, dueToday, myPending })
  } catch (error) {
    console.error('Task summary error:', error)
    return NextResponse.json({ error: 'Failed to get summary' }, { status: 500 })
  }
}
