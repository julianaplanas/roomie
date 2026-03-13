import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateInviteCode } from '@/lib/constants'

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

    const { name } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 })
    }

    const inviteCode = generateInviteCode()
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    const household = await prisma.household.create({
      data: {
        name,
        inviteCode,
        inviteExpiresAt,
        createdById: user.id,
        members: { connect: { id: user.id } },
      },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatarColor: true },
        },
      },
    })

    return NextResponse.json({ household })
  } catch (error) {
    console.error('Create household error:', error)
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 })
  }
}
