'use client'

import { AuthProvider, useAuthContext } from '@/components/AuthProvider'
import BottomNav from '@/components/BottomNav'
import CreateOrJoinHousehold from '@/components/CreateOrJoinHousehold'
import NotificationPrompt from '@/components/NotificationPrompt'

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-sm text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will redirect
  }

  if (!user.householdId) {
    return <CreateOrJoinHousehold />
  }

  return (
    <div className="min-h-screen bg-background">
      <NotificationPrompt />
      {children}
      <BottomNav />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  )
}
