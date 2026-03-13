import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

    const household = await prisma.household.findUnique({
      where: { id: user.householdId },
      select: {
        id: true,
        name: true,
        inviteCode: true,
        inviteExpiresAt: true,
        createdById: true,
      },
    })

    return NextResponse.json({ household })
  } catch (error) {
    console.error('Household info error:', error)
    return NextResponse.json({ error: 'Failed to get household info' }, { status: 500 })
  }
}
