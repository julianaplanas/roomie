'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ width: '100%', maxWidth: '100vw', maxHeight: '90dvh' }}
      >
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>
        <div
          className="px-6 py-4 overflow-y-auto overflow-x-hidden safe-bottom"
          style={{ maxHeight: 'calc(90dvh - 64px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
