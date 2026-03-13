'use client'

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">📡</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re offline</h1>
      <p className="text-gray-500 mb-6">
        Check your internet connection and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary px-6 py-3"
      >
        Try again
      </button>
    </div>
  )
}
