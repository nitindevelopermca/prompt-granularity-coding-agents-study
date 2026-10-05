import { isRecord, type Session } from '../auth/session'

export const LOGIN_URL = 'https://dummyjson.com/auth/login'

export class LoginRequestError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'LoginRequestError'
    this.status = status
  }
}

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<Session> {
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
    throw new LoginRequestError(
      'A network error occurred. Please check your connection and try again.',
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new LoginRequestError(
      response.ok
        ? 'Unexpected response from the server.'
        : 'Unable to sign in. Please try again.',
      response.status,
    )
  }

  if (!response.ok) {
    const message =
      isRecord(payload) &&
      typeof payload.message === 'string' &&
      payload.message.trim() !== ''
        ? payload.message
        : 'Unable to sign in. Please try again.'
    throw new LoginRequestError(message, response.status)
  }

  if (
    !isRecord(payload) ||
    typeof payload.id !== 'number' ||
    typeof payload.accessToken !== 'string'
  ) {
    throw new LoginRequestError('Unexpected response from the server.')
  }

  const session: Session = {
    id: payload.id,
    accessToken: payload.accessToken,
  }

  if (typeof payload.refreshToken === 'string') {
    session.refreshToken = payload.refreshToken
  }

  return session
}
