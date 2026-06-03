import { createHmac } from 'crypto'

export const COOKIE_NAME = 'pos_auth'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function generateSessionToken(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET env var is not set')
  return createHmac('sha256', secret).update('pos-session-v1').digest('hex')
}

export function verifyPin(pin: string): boolean {
  const expected = process.env.CASHIER_PIN
  if (!expected) throw new Error('CASHIER_PIN env var is not set')
  // Constant-time comparison to prevent timing attacks
  if (pin.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < pin.length; i++) {
    diff |= pin.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
