import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { household: true },
    })

    if (!user?.householdId || !user.household) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    if (user.household.createdById !== user.id) {
      return NextResponse.json({ error: 'Only the admin can remove members' }, { status: 403 })
    }

    const { userId } = await req.json()
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { householdId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
