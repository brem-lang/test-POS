import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sql = getDb()
  try {
    const { closing_cash } = await req.json()
    if (closing_cash == null) {
      return NextResponse.json({ error: 'closing_cash is required' }, { status: 400 })
    }
    const [session] = await sql`
      UPDATE sessions
      SET closing_cash = ${closing_cash}, closed_at = NOW(), status = 'closed'
      WHERE id = ${params.id} AND (status = 'open' OR status IS NULL) AND closed_at IS NULL
      RETURNING *
    `
    if (!session) return NextResponse.json({ error: 'Session not found or already closed' }, { status: 404 })
    return NextResponse.json(session)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to close session' }, { status: 500 })
  }
}
