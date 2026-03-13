'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthContext } from '@/components/AuthProvider'
import { getInitials } from '@/lib/utils'

interface Member {
  id: string
  name: string
  email: string
  avatarColor: string
}

interface HouseholdInfo {
  id: string
  name: string
  inviteCode: string
  inviteExpiresAt: string | null
  createdById: string
}

interface NotifPrefs {
  notificationTime: string | null
  hasSubscription: boolean
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuthContext()
  const [members, setMembers] = useState<Member[]>([])
  const [household, setHousehold] = useState<HouseholdInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifTime, setNotifTime] = useState<string>('')
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, householdRes, notifRes] = await Promise.all([
        api.get<{ members: Member[] }>('/api/household/members'),
        api.get<{ household: HouseholdInfo }>('/api/household/info'),
        api.get<NotifPrefs>('/api/notifications/preferences'),
      ])
      setMembers(membersRes.members)
      setHousehold(householdRes.household)
      setNotifTime(notifRes.notificationTime || '')
      setNotifEnabled(notifRes.hasSubscription)
    } catch {
      try {
        const membersRes = await api.get<{ members: Member[] }>('/api/household/members')
        setMembers(membersRes.members)
      } catch {
        // ignore
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRegenerateInvite = async () => {
    try {
      const res = await api.post<{ inviteCode: string }>('/api/household/invite')
      toast.success('New invite code generated!')
      if (household) {
        setHousehold({ ...household, inviteCode: res.inviteCode })
      }
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  const handleCopyInvite = () => {
    const code = household?.inviteCode
    if (!code) return
    const url = `${window.location.origin}/join/${code}`
    navigator.clipboard.writeText(url)
    toast.success('Invite link copied!')
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the household?')) return
    try {
      await api.post('/api/household/members/remove', { userId: memberId })
      toast.success('Member removed')
      fetchData()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this household?')) return
    try {
      await api.post('/api/household/leave')
      toast.success('Left household')
      await refreshUser()
    } catch (err: unknown) {
      toast.error((err as Error).message)
    }
  }

  const handleSaveNotifTime = async () => {
    setSavingNotif(true)
    try {
      await api.post('/api/notifications/preferences', {
        notificationTime: notifTime || null,
      })
      toast.success(notifTime ? `Reminders set for ${notifTime} (Madrid time)` : 'Reminders disabled')
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setSavingNotif(false)
    }
  }

  const handleEnableNotifications = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error('Notifications are not supported in this browser')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      toast.error('Notification permission denied')
      return
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        toast.error('Push notifications not configured on this server')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })
      await api.post('/api/notifications/subscribe', subscription.toJSON())
      setNotifEnabled(true)
      toast.success('Notifications enabled!')
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to enable notifications')
    }
  }

  const isAdmin = household?.createdById === user?.id

  return (
    <div className="page-container">
      <h1 className="page-title">Settings</h1>

      {/* Household info */}
      <div className="card mb-4">
        <h2 className="font-semibold text-foreground mb-3">
          {user?.household?.name || 'Your Household'}
        </h2>

        {household?.inviteCode && (
          <div className="mb-4">
            <p className="text-sm text-muted mb-1">Invite Code</p>
            <div className="flex items-center gap-2">
              <code className="bg-primary-50 text-primary-700 px-3 py-1.5 rounded-xl font-mono text-lg tracking-widest">
                {household.inviteCode}
              </code>
              <button onClick={handleCopyInvite} className="btn-ghost text-sm">
                Copy link
              </button>
            </div>
            {isAdmin && (
              <button onClick={handleRegenerateInvite} className="text-sm text-primary-600 mt-2 hover:underline">
                Regenerate code
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card mb-4">
        <h2 className="font-semibold text-foreground mb-3">Notifications</h2>

        {!notifEnabled ? (
          <div>
            <p className="text-sm text-muted mb-3">
              Enable push notifications to get reminders when tasks are due.
            </p>
            <button onClick={handleEnableNotifications} className="btn-secondary w-full">
              Enable notifications
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted mb-3">
              Choose when you&apos;d like to receive daily task reminders (Europe/Madrid time).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="time"
                className="input flex-1"
                value={notifTime}
                onChange={(e) => setNotifTime(e.target.value)}
              />
              <button
                onClick={handleSaveNotifTime}
                className="btn-primary shrink-0"
                disabled={savingNotif}
              >
                {savingNotif ? 'Saving...' : 'Save'}
              </button>
            </div>
            {notifTime && (
              <p className="text-xs text-muted mt-2">
                You&apos;ll get a reminder at {notifTime} (Madrid time) for tasks due that day.
              </p>
            )}
            <button
              onClick={() => { setNotifTime(''); handleSaveNotifTime() }}
              className="text-xs text-red-500 mt-2 hover:underline"
            >
              Disable reminders
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card mb-4">
        <h2 className="font-semibold text-foreground mb-3">Members</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {member.name}
                      {member.id === household?.createdById && (
                        <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                      {member.id === user?.id && (
                        <span className="ml-1.5 text-xs text-muted">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{member.email}</p>
                  </div>
                </div>
                {isAdmin && member.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {!isAdmin && (
          <button onClick={handleLeave} className="btn-danger w-full">
            Leave household
          </button>
        )}
        <button onClick={logout} className="btn-ghost w-full">
          Sign out
        </button>
      </div>

      <p className="text-center text-xs text-muted mt-8">
        Web Push works on iOS 16.4+ — enable it in Settings if you don&apos;t see notification prompts.
      </p>
    </div>
  )
}
