import type { LoginErrorBody, LoginRequest, LoginSuccess } from '../types/auth'

export const LOGIN_URL = 'https://dummyjson.com/auth/login'

export type LoginFailureKind = 'invalid' | 'network' | 'unknown'

export class LoginRequestError extends Error {
  readonly kind: LoginFailureKind
  readonly status: number | undefined

  constructor(message: string, kind: LoginFailureKind, status?: number) {
    super(message)
    this.name = 'LoginRequestError'
    this.kind = kind
    this.status = status
  }
}

function isLoginSuccess(value: unknown): value is LoginSuccess {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.accessToken === 'string'
}

function readErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined
  }

  const body = value as LoginErrorBody
  return typeof body.message === 'string' && body.message.trim() ? body.message : undefined
}

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<LoginSuccess> {
  const payload: LoginRequest = {
    username,
    password,
    expiresInMins: 30,
  }

  let response: Response
  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new LoginRequestError(
      'Unable to connect. Please check your network and try again.',
      'network',
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = undefined
  }

  if (!response.ok) {
    const apiMessage = readErrorMessage(data)
    const kind: LoginFailureKind = response.status === 400 ? 'invalid' : 'unknown'
    throw new LoginRequestError(
      apiMessage ?? 'Unable to sign in. Please try again.',
      kind,
      response.status,
    )
  }

  if (!isLoginSuccess(data)) {
    throw new LoginRequestError('Sign-in succeeded but the session was incomplete.', 'unknown')
  }

  return data
}
