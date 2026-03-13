import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { calculateNetBalances, simplifyDebts } from '@/lib/debt'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const [expenses, settlements, members] = await Promise.all([
      prisma.expense.findMany({
        where: { householdId: user.householdId },
        include: {
          splits: {
            select: { userId: true, amount: true, settled: true },
          },
        },
      }),
      prisma.settlement.findMany({
        where: { householdId: user.householdId },
      }),
      prisma.user.findMany({
        where: { householdId: user.householdId },
        select: { id: true, name: true, avatarColor: true },
      }),
    ])

    const memberMap = new Map(members.map((m) => [m.id, m]))

    const netBalances = calculateNetBalances(
      expenses.map((e) => ({
        paidById: e.paidById,
        splits: e.splits.map((s) => ({
          userId: s.userId,
          amount: Number(s.amount),
          settled: s.settled,
        })),
      })),
      settlements.map((s) => ({
        payerId: s.payerId,
        payeeId: s.payeeId,
        amount: Number(s.amount),
      }))
    )

    const simplifiedDebts = simplifyDebts(netBalances)

    const balances = simplifiedDebts.map((d) => ({
      from: memberMap.get(d.from) || { id: d.from, name: 'Unknown' },
      to: memberMap.get(d.to) || { id: d.to, name: 'Unknown' },
      amount: d.amount,
    }))

    return NextResponse.json({ balances })
  } catch (error) {
    console.error('Balances error:', error)
    return NextResponse.json({ error: 'Failed to get balances' }, { status: 500 })
  }
}
