import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getNextDueDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // Create completion record
    await prisma.taskCompletion.create({
      data: {
        taskId: task.id,
        completedBy: payload.userId,
      },
    })

    if (task.type === 'one_time') {
      // Mark one-time task as completed
      await prisma.task.update({
        where: { id: task.id },
        data: { completedAt: new Date() },
      })
    } else {
      // Archive old recurring task and create new one with next due date
      await prisma.task.update({
        where: { id: task.id },
        data: { isArchived: true },
      })

      const nextDueDate = getNextDueDate(task.frequency!, new Date())

      await prisma.task.create({
        data: {
          householdId: task.householdId,
          title: task.title,
          type: task.type,
          frequency: task.frequency,
          assignedToId: task.assignedToId,
          dueDate: nextDueDate,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Complete task error:', error)
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 })
  }
}
