'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleKey(digit: string) {
    if (pin.length < 8) setPin(p => p + digit)
  }

  function handleBackspace() {
    setPin(p => p.slice(0, -1))
  }

  async function handleSubmit() {
    if (!pin) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed')
        setPin('')
        return
      }
      toast.success('Welcome!')
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-white">POS System</h1>
          <p className="text-gray-400 text-sm mt-1">Enter your cashier PIN</p>
        </div>

        {/* PIN display */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < pin.length ? 'bg-indigo-400' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Hidden input for keyboard on mobile */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          className="opacity-0 absolute pointer-events-none"
        />

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {keys.map((key, i) => {
            if (key === '') return <div key={i} />
            if (key === '⌫') {
              return (
                <button
                  key={i}
                  onClick={handleBackspace}
                  className="h-16 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-xl font-medium transition-colors flex items-center justify-center"
                >
                  ⌫
                </button>
              )
            }
            return (
              <button
                key={i}
                onClick={() => handleKey(key)}
                className="h-16 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-indigo-600 text-white text-2xl font-semibold transition-colors"
              >
                {key}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || pin.length === 0}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          {loading ? 'Verifying...' : 'Login'}
        </button>
      </div>
    </div>
  )
}
