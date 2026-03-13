import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { notificationTime: true, pushSubscription: true },
    })

    return NextResponse.json({
      notificationTime: user?.notificationTime || null,
      hasSubscription: !!user?.pushSubscription,
    })
  } catch (error) {
    console.error('Get notification prefs error:', error)
    return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { notificationTime } = await req.json()

    // Validate HH:mm format
    if (notificationTime && !/^\d{2}:\d{2}$/.test(notificationTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:mm' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { notificationTime: notificationTime || null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update notification prefs error:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
