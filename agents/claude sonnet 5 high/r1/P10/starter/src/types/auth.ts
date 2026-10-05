// Types for the Login API contract (spec/apis_contract/01_Login_API_Contract.docx)
// and SPEC_FREEZE.md "Login" section.

export interface LoginCredentials {
  username: string;
  password: string;
}

/** Shape of a successful `POST https://dummyjson.com/auth/login` response. */
export interface LoginSuccessResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}

/** Shape of the DummyJSON error body, e.g. `{ "message": "Invalid credentials" }`. */
export interface LoginErrorResponse {
  message?: string;
}

/** Authenticated user/session data retained after a successful login. */
export interface AuthSession {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken: string | null;
}

export type LoginErrorKind = 'validation' | 'invalid-credentials' | 'network' | 'unknown';
