export const AVATAR_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#a855f7', // purple
]

export const CATEGORIES = [
  { name: 'Food', color: '#f97316' },
  { name: 'Utilities', color: '#3b82f6' },
  { name: 'Rent', color: '#8b5cf6' },
  { name: 'Cleaning', color: '#22c55e' },
  { name: 'Transport', color: '#06b6d4' },
  { name: 'Other', color: '#6b7280' },
] as const

export type CategoryName = (typeof CATEGORIES)[number]['name']

export const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly'] as const
export type Frequency = (typeof FREQUENCIES)[number]

export function getCategoryColor(category: string): string {
  return CATEGORIES.find((c) => c.name === category)?.color || '#6b7280'
}

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
