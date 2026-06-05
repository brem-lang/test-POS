'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Session {
  id: number
  opening_cash: number
  opened_at: string
}

export default function OpenSessionPage() {
  const router = useRouter()
  const [existing, setExisting] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [openingCash, setOpeningCash] = useState('')

  useEffect(() => {
    fetch('/api/sessions/current', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(setExisting)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(openingCash)
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_cash: amount }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to open session')
        return
      }
      toast.success('Session opened!')
      router.push('/pos')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  if (existing) {
    return (
      <div className="p-4 md:p-8 max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Session Active</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-2">
          <p className="text-green-800 font-medium">A session is already open.</p>
          <p className="text-sm text-gray-600">Opened: {new Date(existing.opened_at).toLocaleString()}</p>
          <p className="text-sm text-gray-600">Opening cash: ₱{Number(existing.opening_cash).toFixed(2)}</p>
        </div>
        <Link href="/pos" className="mt-4 flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          Go to POS
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Open Session</h1>
      <p className="text-gray-500 text-sm mb-6">Enter the opening cash float to begin taking sales.</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Cash Float</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-lg"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Opening...' : 'Open Session & Go to POS'}
        </button>
      </form>
    </div>
  )
}
