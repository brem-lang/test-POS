import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sql = getDb()
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const sessionId = searchParams.get('session_id')

    let orders
    if (from && to && sessionId) {
      orders = await sql`
        SELECT o.*, array_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
        FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.session_id = ${sessionId} AND o.created_at BETWEEN ${from} AND ${to}
        GROUP BY o.id ORDER BY o.created_at DESC
      `
    } else if (from && to) {
      orders = await sql`
        SELECT o.*, array_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
        FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.created_at BETWEEN ${from} AND ${to}
        GROUP BY o.id ORDER BY o.created_at DESC
      `
    } else if (sessionId) {
      orders = await sql`
        SELECT o.*, array_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
        FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.session_id = ${sessionId}
        GROUP BY o.id ORDER BY o.created_at DESC
      `
    } else {
      orders = await sql`
        SELECT o.*, array_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'unit_price', oi.unit_price)) as items
        FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id ORDER BY o.created_at DESC
      `
    }
    return NextResponse.json(orders)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sql = getDb()
  try {
    const { session_id, payment_method, items } = await req.json()
    if (!session_id || !items?.length) {
      return NextResponse.json({ error: 'session_id and items are required' }, { status: 400 })
    }
    const total = items.reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    )
    const [order] = await sql`
      INSERT INTO orders (session_id, total, payment_method)
      VALUES (${session_id}, ${total}, ${payment_method ?? 'cash'})
      RETURNING *
    `
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
      `
    }
    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
