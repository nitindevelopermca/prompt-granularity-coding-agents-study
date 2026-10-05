import {
  InvalidCredentialsError,
  LoginRequestError,
  NetworkError,
  type LoginSuccess,
} from './types'

const LOGIN_URL = 'https://dummyjson.com/auth/login'

function isLoginSuccess(value: unknown): value is LoginSuccess {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.accessToken === 'string'
}

function readErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

export async function loginRequest(username: string, password: string): Promise<LoginSuccess> {
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
    throw new NetworkError()
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (response.status === 400) {
    throw new InvalidCredentialsError(readErrorMessage(payload, 'Invalid credentials'))
  }

  if (!response.ok) {
    throw new LoginRequestError(readErrorMessage(payload, 'Unable to sign in. Please try again.'))
  }

  if (!isLoginSuccess(payload)) {
    throw new LoginRequestError('Sign-in succeeded but the session response was incomplete.')
  }

  return payload
}
