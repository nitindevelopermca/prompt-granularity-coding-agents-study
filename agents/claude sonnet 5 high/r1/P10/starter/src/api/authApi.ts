// Login API client.
//
// Contract (spec/apis_contract/01_Login_API_Contract.docx, spec/SPEC_FREEZE.md):
//   POST https://dummyjson.com/auth/login
//   Content-Type: application/json
//   body: { username, password, expiresInMins }
//   success: 200 with { id, username, accessToken, refreshToken, ... }
//   failure: 400 with { message: "Invalid credentials" }

import type { LoginCredentials, LoginErrorKind, LoginErrorResponse, LoginSuccessResponse } from '../types/auth';

const LOGIN_URL = 'https://dummyjson.com/auth/login';
const DEFAULT_EXPIRES_IN_MINS = 30;

export class LoginError extends Error {
  kind: LoginErrorKind;

  constructor(message: string, kind: LoginErrorKind) {
    super(message);
    this.name = 'LoginError';
    this.kind = kind;
  }
}

/**
 * Calls the DummyJSON login endpoint.
 * Throws a `LoginError` with a user-facing message and a `kind` describing
 * whether the failure was a network problem, invalid credentials, or
 * something unexpected.
 */
export async function login(credentials: LoginCredentials): Promise<LoginSuccessResponse> {
  let response: Response;

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        expiresInMins: DEFAULT_EXPIRES_IN_MINS,
      }),
    });
  } catch {
    throw new LoginError(
      'Unable to reach the server. Please check your internet connection and try again.',
      'network',
    );
  }

  if (!response.ok) {
    let serverMessage: string | undefined;

    try {
      const body = (await response.json()) as LoginErrorResponse;
      serverMessage = body?.message;
    } catch {
      // Response body was not JSON (or empty); fall back to a generic message below.
    }

    if (response.status === 400) {
      throw new LoginError(serverMessage ?? 'Invalid credentials', 'invalid-credentials');
    }

    throw new LoginError(
      serverMessage ?? 'Something went wrong while logging in. Please try again.',
      'unknown',
    );
  }

  try {
    return (await response.json()) as LoginSuccessResponse;
  } catch {
    throw new LoginError('Received an unexpected response from the server. Please try again.', 'unknown');
  }
}
