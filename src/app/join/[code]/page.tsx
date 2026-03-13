'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    api.get('/api/auth/me')
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setChecking(false))
  }, [])

  const handleJoin = async () => {
    setLoading(true)
    try {
      await api.post('/api/household/join', { code })
      toast.success('Welcome to the household!')
      router.push('/home')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-primary-50 via-white to-purple-50">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;ve been invited!
        </h1>
        <p className="text-muted mb-2">
          Someone wants you to join their household on Roomies.
        </p>
        <div className="card mb-6">
          <p className="text-sm text-muted">Invite code</p>
          <p className="text-2xl font-bold text-primary-600 font-mono tracking-widest">{code}</p>
        </div>

        {isLoggedIn ? (
          <button
            onClick={handleJoin}
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Join household'}
          </button>
        ) : (
          <div className="space-y-3">
            <Link href={`/register?redirect=/join/${code}`} className="btn-primary w-full block">
              Create account & join
            </Link>
            <Link href={`/login?redirect=/join/${code}`} className="btn-secondary w-full block">
              Sign in & join
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
