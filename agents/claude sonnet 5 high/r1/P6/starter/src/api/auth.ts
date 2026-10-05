// Login API client.
// Contract: spec/apis_contract/01_Login_API_Contract.docx, spec/SPEC_FREEZE.md
//   POST https://dummyjson.com/auth/login
//   Content-Type: application/json
//   Body: { username, password }
//   Success: 200 with { id, username, accessToken, refreshToken, ... }
//   Invalid credentials: 400 with { message: "Invalid credentials" }

import { API_BASE_URL } from './config';
import type { LoginRequest, LoginResponse } from '../types/auth';

const LOGIN_URL = `${API_BASE_URL}/auth/login`;

/** Generic, human-readable fallback messages by failure kind. */
export const LOGIN_ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  invalidCredentials: 'Invalid credentials',
  unexpected: 'Something went wrong. Please try again.',
} as const;

export class LoginError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LoginError';
    this.status = status;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Authenticates against DummyJSON. Resolves with the login response on
 * success (HTTP 200). Rejects with a LoginError describing the failure
 * (invalid credentials, other API error, or network failure) otherwise.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    // fetch throws on network failure (offline, DNS, CORS, etc.)
    throw new LoginError(LOGIN_ERROR_MESSAGES.network);
  }

  if (!response.ok) {
    let message: string = LOGIN_ERROR_MESSAGES.invalidCredentials;
    try {
      const data: unknown = await response.json();
      if (isRecord(data) && typeof data.message === 'string' && data.message.trim()) {
        message = data.message;
      }
    } catch {
      // Body wasn't JSON (or was empty); keep the default message.
    }
    throw new LoginError(message, response.status);
  }

  try {
    const data = (await response.json()) as LoginResponse;
    if (typeof data.id !== 'number' || typeof data.accessToken !== 'string') {
      throw new Error('missing required fields');
    }
    return data;
  } catch {
    throw new LoginError(LOGIN_ERROR_MESSAGES.unexpected);
  }
}
