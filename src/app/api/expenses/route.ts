import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import Decimal from 'decimal.js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const expenses = await prisma.expense.findMany({
      where: { householdId: user.householdId },
      include: {
        paidBy: { select: { id: true, name: true, avatarColor: true } },
        splits: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json({ error: 'Failed to get expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser()
    if (!payload) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user?.householdId) return NextResponse.json({ error: 'No household' }, { status: 404 })

    const { title, amount, category, date, paidById, splitBetween } = await req.json()

    if (!title || !amount || !category || !date || !paidById || !splitBetween?.length) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const totalAmount = new Decimal(amount)
    const splitCount = splitBetween.length
    const perPerson = totalAmount.dividedBy(splitCount).toDecimalPlaces(2, Decimal.ROUND_DOWN)
    const remainder = totalAmount.minus(perPerson.times(splitCount))

    const splits = splitBetween.map((userId: string, index: number) => ({
      userId,
      amount: index === 0
        ? perPerson.plus(remainder).toNumber()
        : perPerson.toNumber(),
    }))

    const expense = await prisma.expense.create({
      data: {
        householdId: user.householdId,
        title,
        amount: totalAmount.toNumber(),
        category,
        date: new Date(date),
        paidById,
        splits: {
          create: splits,
        },
      },
      include: {
        paidBy: { select: { id: true, name: true, avatarColor: true } },
        splits: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Create expense error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
