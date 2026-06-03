import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = getDb()
  try {
    const sessions = await sql`SELECT * FROM sessions ORDER BY opened_at DESC`
    return NextResponse.json(sessions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const sql = getDb()
  try {
    const [open] = await sql`SELECT id FROM sessions WHERE status = 'open' LIMIT 1`
    if (open) {
      return NextResponse.json({ error: 'A session is already open' }, { status: 409 })
    }
    const { opening_cash } = await req.json()
    if (opening_cash == null) {
      return NextResponse.json({ error: 'opening_cash is required' }, { status: 400 })
    }
    const [session] = await sql`
      INSERT INTO sessions (opening_cash) VALUES (${opening_cash}) RETURNING *
    `
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to open session' }, { status: 500 })
  }
}
