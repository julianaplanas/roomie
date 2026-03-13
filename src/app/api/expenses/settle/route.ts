import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const { payerId, payeeId, amount, note } = await req.json()

    if (!payerId || !payeeId || !amount) {
      return NextResponse.json({ error: 'Payer, payee, and amount are required' }, { status: 400 })
    }

    const settlement = await prisma.settlement.create({
      data: {
        householdId: user.householdId,
        payerId,
        payeeId,
        amount,
        note,
      },
    })

    return NextResponse.json({ settlement })
  } catch (error) {
    console.error('Settle error:', error)
    return NextResponse.json({ error: 'Failed to settle' }, { status: 500 })
  }
}
