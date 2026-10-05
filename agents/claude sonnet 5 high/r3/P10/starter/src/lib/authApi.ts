import type { LoginApiErrorResponse, LoginApiResponse, LoginRequestBody } from '../types/auth'

const LOGIN_URL = 'https://dummyjson.com/auth/login'

export class LoginError extends Error {
  /** True when this represents a network/connectivity failure rather than a rejected login. */
  isNetworkError: boolean

  constructor(message: string, isNetworkError = false) {
    super(message)
    this.name = 'LoginError'
    this.isNetworkError = isNetworkError
  }
}

/**
 * Calls the DummyJSON login endpoint per spec/SPEC_FREEZE.md.
 * Throws LoginError with a user-presentable message on invalid credentials
 * or network failure.
 */
export async function login(body: LoginRequestBody): Promise<LoginApiResponse> {
  let response: Response

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new LoginError('Network error. Please check your connection and try again.', true)
  }

  if (!response.ok) {
    let message = 'Invalid credentials'
    try {
      const errorBody = (await response.json()) as LoginApiErrorResponse
      if (errorBody?.message) {
        message = errorBody.message
      }
    } catch {
      // Ignore JSON parsing failures; fall back to default message.
    }
    throw new LoginError(message)
  }

  try {
    return (await response.json()) as LoginApiResponse
  } catch {
    throw new LoginError('Unexpected response from server. Please try again.')
  }
}
