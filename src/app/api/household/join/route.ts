import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.householdId) {
      return NextResponse.json({ error: 'You already belong to a household' }, { status: 400 })
    }

    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })
    }

    const household = await prisma.household.findUnique({
      where: { inviteCode: code },
    })

    if (!household) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    if (household.inviteExpiresAt && household.inviteExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { householdId: household.id },
    })

    return NextResponse.json({
      household: {
        id: household.id,
        name: household.name,
      },
    })
  } catch (error) {
    console.error('Join error:', error)
    return NextResponse.json({ error: 'Failed to join household' }, { status: 500 })
  }
}
