import { API_BASE_URL } from './config'
import type { LoginResponse } from '../types'

/** Error raised by the login call; carries the HTTP status when available. */
export class AuthError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * POST https://dummyjson.com/auth/login
 * On invalid credentials DummyJSON replies HTTP 400 with { "message": "Invalid credentials" }.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 30 }),
    })
  } catch {
    throw new AuthError('Network error. Please check your connection and try again.')
  }

  if (!response.ok) {
    let message = 'Invalid credentials'
    try {
      const data: unknown = await response.json()
      if (data && typeof data === 'object' && 'message' in data) {
        const candidate = (data as { message?: unknown }).message
        if (typeof candidate === 'string' && candidate.trim() !== '') {
          message = candidate
        }
      }
    } catch {
      // Response body was not JSON; fall back to the default message.
    }
    throw new AuthError(message, response.status)
  }

  return (await response.json()) as LoginResponse
}
