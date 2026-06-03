import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = getDb()
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        category TEXT,
        stock INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        opened_at TIMESTAMP DEFAULT NOW(),
        closed_at TIMESTAMP,
        opening_cash NUMERIC(10,2) NOT NULL,
        closing_cash NUMERIC(10,2),
        status TEXT DEFAULT 'open'
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        session_id INT REFERENCES sessions(id),
        total NUMERIC(10,2) NOT NULL,
        payment_method TEXT DEFAULT 'cash',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id),
        product_id INT REFERENCES products(id),
        quantity INT NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL
      )
    `
    return NextResponse.json({ message: 'Database schema created successfully' })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Failed to create schema' }, { status: 500 })
  }
}
