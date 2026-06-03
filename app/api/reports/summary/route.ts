import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sql = getDb()
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') ?? new Date().toISOString().split('T')[0] + 'T00:00:00'
    const to = searchParams.get('to') ?? new Date().toISOString().split('T')[0] + 'T23:59:59'

    const [summary] = await sql`
      SELECT
        COALESCE(SUM(total), 0) AS revenue,
        COUNT(*) AS order_count,
        COALESCE(AVG(total), 0) AS avg_order_value
      FROM orders
      WHERE created_at BETWEEN ${from} AND ${to}
    `

    const topProducts = await sql`
      SELECT p.name, SUM(oi.quantity) AS total_qty
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ${from} AND ${to}
      GROUP BY p.name
      ORDER BY total_qty DESC
      LIMIT 10
    `

    const [itemsSoldRow] = await sql`
      SELECT COALESCE(SUM(oi.quantity), 0) AS count
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ${from} AND ${to}
    `

    return NextResponse.json({
      revenue: Number(summary.revenue),
      order_count: Number(summary.order_count),
      avg_order_value: Number(summary.avg_order_value),
      items_sold: Number(itemsSoldRow?.count ?? 0),
      top_products: topProducts.map((r) => ({
        name: r.name as string,
        qty: Number(r.total_qty),
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
