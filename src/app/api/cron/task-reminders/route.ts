import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/notifications'
import type { PushSubscription } from 'web-push'

/**
 * This endpoint should be called every 15 minutes (or more frequently).
 * It checks each user's preferred notification time (Europe/Madrid)
 * and sends task reminders to users whose time matches the current window.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current time in Europe/Madrid
    const nowMadrid = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' })
    )
    const currentHH = String(nowMadrid.getHours()).padStart(2, '0')
    const currentMM = String(nowMadrid.getMinutes()).padStart(2, '0')
    const currentTime = `${currentHH}:${currentMM}`

    // Match users whose notification time is within the current 15-min window
    // e.g. if called at 08:00, match 08:00-08:14
    const currentMinutes = nowMadrid.getHours() * 60 + nowMadrid.getMinutes()
    const windowEnd = currentMinutes + 14

    // Find users with push subscriptions and notification time set
    const users = await prisma.user.findMany({
      where: {
        pushSubscription: { not: Prisma.DbNull },
        notificationTime: { not: null },
        householdId: { not: null },
      },
      select: {
        id: true,
        notificationTime: true,
        pushSubscription: true,
        householdId: true,
      },
    })

    // Filter users whose notification time falls in the current window
    const eligibleUsers = users.filter((u) => {
      if (!u.notificationTime) return false
      const [hh, mm] = u.notificationTime.split(':').map(Number)
      const userMinutes = hh * 60 + mm
      return userMinutes >= currentMinutes && userMinutes <= windowEnd
    })

    // Today in UTC for date comparison
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    let sent = 0
    const expiredSubscriptions: string[] = []

    for (const user of eligibleUsers) {
      // Find tasks due today assigned to this user
      const tasksDueToday = await prisma.task.findMany({
        where: {
          assignedToId: user.id,
          householdId: user.householdId!,
          isArchived: false,
          completedAt: null,
          dueDate: { gte: todayStart, lt: todayEnd },
        },
        select: { title: true },
      })

      if (tasksDueToday.length === 0) continue

      const body =
        tasksDueToday.length === 1
          ? tasksDueToday[0].title
          : `You have ${tasksDueToday.length} tasks due today`

      const result = await sendPushNotification(
        user.pushSubscription as unknown as PushSubscription,
        {
          title: 'Tasks due today',
          body,
          url: '/tasks',
        }
      )

      if (result.expired) {
        expiredSubscriptions.push(user.id)
      } else {
        sent++
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
      currentTimeMadrid: currentTime,
      eligibleUsers: eligibleUsers.length,
      notificationsSent: sent,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
