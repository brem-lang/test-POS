import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = getDb()
  try {
    const [session] = await sql`SELECT * FROM sessions WHERE status = 'open' LIMIT 1`
    if (!session) return NextResponse.json(null, { status: 404 })
    return NextResponse.json(session)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch current session' }, { status: 500 })
  }
}
