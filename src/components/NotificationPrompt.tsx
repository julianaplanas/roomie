'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationPrompt() {
  const [show, setShow] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    // Only show if browser supports notifications, permission not yet decided, and VAPID key configured
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      Notification.permission === 'default' &&
      VAPID_PUBLIC_KEY
    ) {
      // Don't show immediately — wait a bit
      const timer = setTimeout(() => {
        const dismissed = sessionStorage.getItem('notification-prompt-dismissed')
        if (!dismissed) {
          setShow(true)
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleEnable = async () => {
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        })
        await api.post('/api/notifications/subscribe', subscription.toJSON())
      }
    } catch (error) {
      console.error('Notification subscription error:', error)
    } finally {
      setShow(false)
      setSubscribing(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('notification-prompt-dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-float p-4 border border-gray-100">
        <div className="flex gap-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm mb-1">
              Enable notifications?
            </h3>
            <p className="text-xs text-muted mb-3">
              Get reminders when tasks are due and when new tasks are assigned to you.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={subscribing}
                className="btn-primary text-xs px-4 py-1.5"
              >
                {subscribing ? 'Enabling...' : 'Enable'}
              </button>
              <button
                onClick={handleDismiss}
                className="btn-ghost text-xs px-4 py-1.5"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
