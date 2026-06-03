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

interface Stats {
  revenue: number
  order_count: number
}

export default function CloseSessionPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [closingCash, setClosingCash] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/sessions/current')
      .then(r => r.ok ? r.json() : null)
      .then(async s => {
        setSession(s)
        if (s) {
          const today = new Date().toISOString().split('T')[0]
          const sum = await fetch(`/api/reports/summary?from=${today}T00:00:00&to=${today}T23:59:59`).then(r => r.json())
          setStats(sum)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) return
    const amount = parseFloat(closingCash)
    if (isNaN(amount) || amount < 0) { toast.error('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${session.id}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closing_cash: amount }),
      })
      if (!res.ok) { toast.error('Failed to close session'); return }
      toast.success('Session closed!')
      router.push('/')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  if (!session) {
    return (
      <div className="p-4 md:p-8 max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-4">No Active Session</h1>
        <p className="text-gray-500 mb-4">There is no open session to close.</p>
        <Link href="/open-session" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block">
          Open a Session
        </Link>
      </div>
    )
  }

  const expectedCash = Number(session.opening_cash) + (stats?.revenue ?? 0)
  const variance = closingCash ? parseFloat(closingCash) - expectedCash : null

  return (
    <div className="p-4 md:p-8 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Close Session</h1>
      <p className="text-gray-500 text-sm mb-6">Reconcile and close the current session.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Session Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Opened at</p>
            <p className="font-medium text-gray-900">{new Date(session.opened_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400">Orders today</p>
            <p className="font-medium text-gray-900">{stats?.order_count ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-400">Opening cash</p>
            <p className="font-medium text-gray-900">₱{Number(session.opening_cash).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400">Total sales</p>
            <p className="font-medium text-gray-900">₱{(stats?.revenue ?? 0).toFixed(2)}</p>
          </div>
          <div className="col-span-2 pt-2 border-t border-gray-100">
            <p className="text-gray-400">Expected cash in drawer</p>
            <p className="text-2xl font-bold text-indigo-600">₱{expectedCash.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Actual Closing Cash</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₱</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={closingCash}
              onChange={e => setClosingCash(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 text-lg"
              required
            />
          </div>
          {variance !== null && (
            <p className={`text-sm mt-1.5 font-medium ${variance === 0 ? 'text-green-600' : 'text-amber-600'}`}>
              Variance: {variance >= 0 ? '+' : ''}₱{variance.toFixed(2)}
              {variance === 0 && ' ✓ Perfect match'}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Closing...' : 'Close Session'}
        </button>
      </form>
    </div>
  )
}
