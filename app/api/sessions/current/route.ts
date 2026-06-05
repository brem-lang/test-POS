import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sql = getDb()
  try {
    const [session] = await sql`
      SELECT * FROM sessions
      WHERE closed_at IS NULL
      ORDER BY opened_at DESC
      LIMIT 1
    `
    if (!session) return NextResponse.json(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch current session' }, { status: 500 })
  }
}
