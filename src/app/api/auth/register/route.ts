import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken, COOKIE_OPTIONS } from '@/lib/auth'
import { getRandomAvatarColor } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        avatarColor: getRandomAvatarColor(),
      },
    })

    const token = signToken({ userId: user.id, email: user.email })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        householdId: user.householdId,
      },
    })
    response.cookies.set('token', token, COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
