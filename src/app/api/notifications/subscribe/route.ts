import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const subscription = await req.json()

    await prisma.user.update({
      where: { id: payload.userId },
      data: { pushSubscription: subscription },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
