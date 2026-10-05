import { parseSession } from './session'
import type { LoginErrorBody, Session } from './types'

const LOGIN_URL = 'https://dummyjson.com/auth/login'

export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid credentials') {
    super(message)
    this.name = 'InvalidCredentialsError'
  }
}

export class NetworkError extends Error {
  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message)
    this.name = 'NetworkError'
  }
}

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined
  }
  const message = (body as LoginErrorBody).message
  return typeof message === 'string' && message.trim().length > 0 ? message : undefined
}

export async function loginWithPassword(username: string, password: string): Promise<Session> {
  let response: Response

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new NetworkError()
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (response.status === 400) {
    throw new InvalidCredentialsError(readErrorMessage(body) ?? 'Invalid credentials')
  }

  if (!response.ok) {
    throw new NetworkError('Unable to sign in right now. Please try again.')
  }

  const session = parseSession(body)
  if (!session) {
    throw new NetworkError('Unable to sign in right now. Please try again.')
  }

  return session
}
