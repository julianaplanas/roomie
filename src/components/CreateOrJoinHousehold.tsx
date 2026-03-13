'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthContext } from '@/components/AuthProvider'

export default function CreateOrJoinHousehold() {
  const { refreshUser } = useAuthContext()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await api.post('/api/household/create', { name })
      toast.success('Household created!')
      await refreshUser()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      await api.post('/api/household/join', { code })
      toast.success('Joined household!')
      await refreshUser()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-primary-50 via-white to-purple-50">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🏡</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Set up your household</h1>
          <p className="text-muted mb-8">Create a new household or join an existing one.</p>
          <div className="space-y-3">
            <button onClick={() => setMode('create')} className="btn-primary w-full">
              Create a household
            </button>
            <button onClick={() => setMode('join')} className="btn-secondary w-full">
              Join with invite code
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-primary-50 via-white to-purple-50">
        <div className="w-full max-w-sm">
          <button onClick={() => setMode('choose')} className="btn-ghost mb-4">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-6">Name your household</h1>
          <input
            type="text"
            className="input mb-4"
            placeholder='e.g. "The Fun Flat"'
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="btn-primary w-full"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Creating...' : 'Create household'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-primary-50 via-white to-purple-50">
      <div className="w-full max-w-sm">
        <button onClick={() => setMode('choose')} className="btn-ghost mb-4">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Enter invite code</h1>
        <input
          type="text"
          className="input mb-4 text-center text-xl font-mono tracking-widest uppercase"
          placeholder="ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          autoFocus
        />
        <button
          onClick={handleJoin}
          className="btn-primary w-full"
          disabled={loading || code.length < 6}
        >
          {loading ? 'Joining...' : 'Join household'}
        </button>
      </div>
    </div>
  )
}
