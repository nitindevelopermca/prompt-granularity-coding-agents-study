import { API_BASE } from './config'
import { ApiError } from './errors'
import type { AuthUser } from '../types'

export interface LoginCredentials {
  username: string
  password: string
}

interface LoginResponsePayload {
  id: number
  username: string
  accessToken: string
  refreshToken?: string
}

interface ErrorPayload {
  message?: string
}

/**
 * POST https://dummyjson.com/auth/login
 * spec/apis_contract/01_Login_API_Contract.docx + spec/SPEC_FREEZE.md
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        expiresInMins: 30,
      }),
    })
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.')
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const payload = data as ErrorPayload | null
    const message = payload?.message ?? 'Invalid credentials'
    throw new ApiError(message, response.status)
  }

  const payload = data as LoginResponsePayload
  return {
    id: payload.id,
    username: payload.username,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  }
}
