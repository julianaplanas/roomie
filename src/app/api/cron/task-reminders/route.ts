import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/notifications'
import type { PushSubscription } from 'web-push'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // Find tasks due today that haven't been completed
    const tasksDueToday = await prisma.task.findMany({
      where: {
        isArchived: false,
        completedAt: null,
        dueDate: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, pushSubscription: true },
        },
      },
    })

    let sent = 0
    const expiredSubscriptions: string[] = []

    for (const task of tasksDueToday) {
      if (task.assignedTo.pushSubscription) {
        const result = await sendPushNotification(
          task.assignedTo.pushSubscription as unknown as PushSubscription,
          {
            title: 'Task due today',
            body: task.title,
            url: '/tasks',
          }
        )
        if (result.expired) {
          expiredSubscriptions.push(task.assignedTo.id)
        } else {
          sent++
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: expiredSubscriptions } },
        data: { pushSubscription: Prisma.DbNull },
      })
    }

    return NextResponse.json({
      success: true,
      tasksDueToday: tasksDueToday.length,
      notificationsSent: sent,
      expiredSubscriptions: expiredSubscriptions.length,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
