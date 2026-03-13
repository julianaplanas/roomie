'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

export interface User {
  id: string
  name: string
  email: string
  avatarColor: string
  householdId: string | null
  household?: {
    id: string
    name: string
  } | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/api/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }

  const register = async (name: string, email: string, password: string) => {
    const data = await api.post<{ user: User }>('/api/auth/register', { name, email, password })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await api.post('/api/auth/logout')
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = fetchUser

  return { user, loading, login, register, logout, refreshUser }
}
