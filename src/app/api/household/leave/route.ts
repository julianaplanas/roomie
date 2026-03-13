import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

    if (!user?.householdId) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 })
    }

    if (user.household?.createdById === user.id) {
      return NextResponse.json(
        { error: 'Admin cannot leave. Transfer ownership or delete the household.' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { householdId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave error:', error)
    return NextResponse.json({ error: 'Failed to leave household' }, { status: 500 })
  }
}
