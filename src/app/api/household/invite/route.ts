import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateInviteCode } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const payload = getCurrentUser()
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { household: true },
    })

    if (!user?.householdId || !user.household) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    if (user.household.createdById !== user.id) {
      return NextResponse.json({ error: 'Only the admin can regenerate invite codes' }, { status: 403 })
    }

    const inviteCode = generateInviteCode()
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const household = await prisma.household.update({
      where: { id: user.householdId },
      data: { inviteCode, inviteExpiresAt },
    })

    return NextResponse.json({
      inviteCode: household.inviteCode,
      inviteExpiresAt: household.inviteExpiresAt,
    })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Failed to generate invite' }, { status: 500 })
  }
}
