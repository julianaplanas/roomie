'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/expenses', label: 'Expenses', icon: '💰' },
  { href: '/tasks', label: 'Tasks', icon: '✅' },
  { href: '/stats', label: 'Stats', icon: '📊' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full transition-colors',
                active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <span className="text-xl mb-0.5">{tab.icon}</span>
              <span className={cn('text-xs', active && 'font-semibold')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
