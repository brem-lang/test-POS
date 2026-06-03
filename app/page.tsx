'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'

interface Summary {
  revenue: number
  order_count: number
  avg_order_value: number
  items_sold: number
}

interface Session {
  id: number
  opening_cash: number
  status: string
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      fetch(`/api/reports/summary?from=${today}T00:00:00&to=${today}T23:59:59`).then(r => r.json()),
      fetch('/api/sessions/current').then(r => r.ok ? r.json() : null),
    ]).then(([sum, sess]) => {
      setSummary(sum)
      setSession(sess)
    }).finally(() => setLoading(false))
  }, [])

  const sessionCashBalance = session
    ? Number(session.opening_cash) + (summary?.revenue ?? 0)
    : null

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatsCard label="Today's Sales" value={`₱${(summary?.revenue ?? 0).toFixed(2)}`} color="green" />
          <StatsCard label="Total Orders" value={String(summary?.order_count ?? 0)} color="blue" />
          <StatsCard label="Items Sold" value={String(summary?.items_sold ?? 0)} color="amber" />
          <StatsCard
            label="Cash Balance"
            value={session ? `₱${sessionCashBalance?.toFixed(2)}` : 'No session'}
            sub={session ? `Opened ₱${Number(session.opening_cash).toFixed(2)}` : undefined}
            color="indigo"
          />
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Access</h2>
        <div className="grid grid-cols-1 gap-3">
          <Link href="/pos" className="flex items-center gap-3 px-5 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors active:scale-95">
            <span className="text-2xl">🛒</span>
            <span>Open POS</span>
          </Link>
          <Link href="/products" className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            <span className="text-2xl">📦</span>
            <span>Manage Products</span>
          </Link>
          <Link href="/reports" className="flex items-center gap-3 px-5 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            <span className="text-2xl">📈</span>
            <span>View Reports</span>
          </Link>
        </div>
      </div>

      {!session && !loading && (
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          No active session.{' '}
          <Link href="/open-session" className="underline font-medium">Open a session</Link>{' '}
          to start taking sales.
        </div>
      )}
    </div>
  )
}
