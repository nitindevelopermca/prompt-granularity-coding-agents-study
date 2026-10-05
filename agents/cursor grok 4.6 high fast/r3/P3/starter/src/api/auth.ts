import type { LoginErrorResponse, LoginSuccessResponse, Session } from '../types'

const LOGIN_URL = 'https://dummyjson.com/auth/login'

export type LoginFailureKind = 'invalid' | 'network' | 'unknown'

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; kind: LoginFailureKind; message: string }

function isSessionPayload(value: unknown): value is LoginSuccessResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.accessToken === 'string' && record.accessToken.length > 0
}

export async function loginWithPassword(username: string, password: string): Promise<LoginResult> {
  let response: Response

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        expiresInMins: 30,
      }),
    })
  } catch {
    return {
      ok: false,
      kind: 'network',
      message: 'Unable to reach the server. Check your connection and try again.',
    }
  }

  if (response.status === 400) {
    let message = 'Invalid credentials'
    try {
      const body = (await response.json()) as LoginErrorResponse
      if (typeof body.message === 'string' && body.message.trim()) {
        message = body.message
      }
    } catch {
      // DummyJSON 400 body is { "message": "Invalid credentials" }; keep that text if JSON is unreadable.
    }
    return { ok: false, kind: 'invalid', message }
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: 'unknown',
      message: 'Something went wrong while signing in. Please try again.',
    }
  }

  try {
    const data: unknown = await response.json()
    if (!isSessionPayload(data)) {
      return {
        ok: false,
        kind: 'unknown',
        message: 'Something went wrong while signing in. Please try again.',
      }
    }

    const session: Session = {
      id: data.id,
      accessToken: data.accessToken,
    }
    if (typeof data.refreshToken === 'string' && data.refreshToken.length > 0) {
      session.refreshToken = data.refreshToken
    }
    return { ok: true, session }
  } catch {
    return {
      ok: false,
      kind: 'unknown',
      message: 'Something went wrong while signing in. Please try again.',
    }
  }
}
