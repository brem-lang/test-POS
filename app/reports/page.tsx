'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Summary {
  revenue: number
  order_count: number
  avg_order_value: number
  items_sold: number
  top_products: { name: string; qty: number }[]
}

interface Order {
  id: number
  created_at: string
  total: number | string
  payment_method: string
  items: { product_id: number; quantity: number; unit_price: number }[] | null
}

interface Session {
  id: number
  opened_at: string
  closed_at: string | null
  opening_cash: number | string
  closing_cash: number | string | null
  status: string
}

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [sum, ords, sess] = await Promise.all([
      fetch(`/api/reports/summary?from=${from}T00:00:00&to=${to}T23:59:59`).then(r => r.json()),
      fetch(`/api/orders?from=${from}T00:00:00&to=${to}T23:59:59`).then(r => r.json()),
      fetch('/api/sessions').then(r => r.json()),
    ])
    setSummary(sum)
    setOrders(Array.isArray(ords) ? ords : [])
    setSessions(Array.isArray(sess) ? sess : [])
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  function exportCSV() {
    const rows = [
      ['Order #', 'Time', 'Items', 'Total', 'Payment'],
      ...orders.map(o => [
        o.id,
        new Date(o.created_at).toLocaleString(),
        o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0,
        Number(o.total).toFixed(2),
        o.payment_method,
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function duration(openedAt: string, closedAt: string | null) {
    if (!closedAt) return 'Open'
    const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime()
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={exportCSV} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">₱{(summary?.revenue ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{summary?.order_count ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">₱{(summary?.avg_order_value ?? 0).toFixed(2)}</p>
            </div>
          </div>

          {summary?.top_products && summary.top_products.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Top Selling Products</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.top_products} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#6366f1" radius={[4, 4, 0, 0]} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Orders</h2>
              <span className="text-sm text-gray-400">{orders.length} records</span>
            </div>
            {orders.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No orders in this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Order #</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Time</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Items</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">#{o.id}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{new Date(o.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0}</td>
                        <td className="px-4 py-3 text-right font-medium">₱{Number(o.total).toFixed(2)}</td>
                        <td className="px-4 py-3 capitalize text-gray-600 hidden sm:table-cell">{o.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Session History</h2>
            </div>
            {sessions.length === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">No sessions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Opened</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Opening</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Closing</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Duration</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessions.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 text-xs">{new Date(s.opened_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">₱{Number(s.opening_cash).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">{s.closing_cash != null ? `₱${Number(s.closing_cash).toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{duration(s.opened_at, s.closed_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
