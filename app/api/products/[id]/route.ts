import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getDb()
  try {
    const { name, price, category, stock } = await req.json()
    const [product] = await sql`
      UPDATE products
      SET name = ${name}, price = ${price}, category = ${category ?? null}, stock = ${stock ?? 0}
      WHERE id = ${params.id}
      RETURNING *
    `
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getDb()
  try {
    await sql`DELETE FROM products WHERE id = ${params.id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
