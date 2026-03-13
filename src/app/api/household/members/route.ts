import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    const members = await prisma.user.findMany({
      where: { householdId: user.householdId },
      select: { id: true, name: true, email: true, avatarColor: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Members error:', error)
    return NextResponse.json({ error: 'Failed to get members' }, { status: 500 })
  }
}
