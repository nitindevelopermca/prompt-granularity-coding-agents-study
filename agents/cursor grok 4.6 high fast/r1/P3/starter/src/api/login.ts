export type Session = {
  id: number
  accessToken: string
}

export type LoginErrorCode = 'invalid_credentials' | 'network' | 'http'

export class LoginRequestError extends Error {
  readonly code: LoginErrorCode

  constructor(message: string, code: LoginErrorCode) {
    super(message)
    this.name = 'LoginRequestError'
    this.code = code
  }
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function readMessage(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.message === 'string' && body.message.trim()) {
    return body.message
  }
  return fallback
}

function parseSession(body: unknown): Session {
  if (!isRecord(body)) {
    throw new LoginRequestError('Unexpected login response. Please try again.', 'http')
  }

  const { id, accessToken } = body
  if (typeof id !== 'number' || !Number.isFinite(id) || typeof accessToken !== 'string' || !accessToken) {
    throw new LoginRequestError('Unexpected login response. Please try again.', 'http')
  }

  return { id, accessToken }
}

export async function login(username: string, password: string): Promise<Session> {
  let response: Response
  try {
    response = await fetch('https://dummyjson.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        expiresInMins: 60,
      }),
    })
  } catch {
    throw new LoginRequestError(
      'Unable to reach the server. Check your connection and try again.',
      'network',
    )
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  if (!response.ok) {
    const fallback =
      response.status === 400
        ? 'Invalid credentials'
        : 'Unable to sign in. Please try again.'
    const message = readMessage(body, fallback)
    throw new LoginRequestError(
      message,
      response.status === 400 ? 'invalid_credentials' : 'http',
    )
  }

  return parseSession(body)
}
