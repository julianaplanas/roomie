import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { sendPushNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const tasks = await prisma.task.findMany({
      where: {
        householdId: user.householdId,
        isArchived: false,
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarColor: true } },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Failed to get tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const { title, type, frequency, assignedToId, dueDate } = await req.json()

    if (!title || !type || !assignedToId) {
      return NextResponse.json({ error: 'Title, type, and assignee are required' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        householdId: user.householdId,
        title,
        type,
        frequency: type === 'recurring' ? frequency : null,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarColor: true, pushSubscription: true } },
      },
    })

    // Send push notification to assignee
    if (task.assignedTo.pushSubscription && task.assignedToId !== payload.userId) {
      await sendPushNotification(
        task.assignedTo.pushSubscription as unknown as import('web-push').PushSubscription,
        {
          title: 'New task assigned',
          body: `You've been assigned: ${task.title}`,
          url: '/tasks',
        }
      )
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
