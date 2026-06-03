import { NextRequest, NextResponse } from 'next/server'
import { generateSessionToken, verifyPin, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

// In-memory rate limiter: max 5 attempts per IP per 15 min window
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }
  entry.count++
  return entry.count > 5
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    )
  }

  let pin: string
  try {
    const body = await req.json()
    pin = String(body.pin ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!pin) {
    return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
  }

  if (!verifyPin(pin)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const token = generateSessionToken()
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
