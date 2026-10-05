import type { Session } from '../auth/session'

const LOGIN_URL = 'https://dummyjson.com/auth/login'

export class LoginError extends Error {
  readonly reason: 'invalid' | 'network' | 'unknown'

  constructor(reason: 'invalid' | 'network' | 'unknown', message: string) {
    super(message)
    this.name = 'LoginError'
    this.reason = reason
  }
}

function parseLoginResponse(data: unknown): Session {
  if (typeof data !== 'object' || data === null) {
    throw new LoginError('unknown', 'Unexpected response from server.')
  }

  const record = data as Record<string, unknown>
  if (typeof record.id !== 'number' || typeof record.accessToken !== 'string' || record.accessToken.length === 0) {
    throw new LoginError('unknown', 'Unexpected response from server.')
  }

  const session: Session = {
    id: record.id,
    accessToken: record.accessToken,
  }

  if (typeof record.refreshToken === 'string' && record.refreshToken.length > 0) {
    session.refreshToken = record.refreshToken
  }

  return session
}

export async function loginWithPassword(username: string, password: string): Promise<Session> {
  let response: Response

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        expiresInMins: 60,
      }),
    })
  } catch {
    throw new LoginError('network', 'Unable to connect. Check your network and try again.')
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (response.status === 400) {
    const message =
      typeof payload === 'object' && payload !== null && typeof (payload as { message?: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : 'Invalid credentials'
    throw new LoginError('invalid', message)
  }

  if (!response.ok) {
    throw new LoginError('unknown', 'Login failed. Please try again.')
  }

  return parseLoginResponse(payload)
}
