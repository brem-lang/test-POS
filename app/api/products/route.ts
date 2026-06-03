import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = getDb()
  try {
    const products = await sql`SELECT * FROM products ORDER BY name`
    return NextResponse.json(products)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sql = getDb()
  try {
    const { name, price, category, stock } = await req.json()
    if (!name || price == null) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 })
    }
    const [product] = await sql`
      INSERT INTO products (name, price, category, stock)
      VALUES (${name}, ${price}, ${category ?? null}, ${stock ?? 0})
      RETURNING *
    `
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
