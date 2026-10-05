export interface AuthUser {
  id: number
  username: string
  email?: string
  firstName?: string
  lastName?: string
  image?: string
  accessToken: string
  refreshToken?: string
}

export interface LoginRequestBody {
  username: string
  password: string
  expiresInMins?: number
}

/** Raw shape returned by POST https://dummyjson.com/auth/login on success. */
export interface LoginApiResponse {
  id: number
  username: string
  email?: string
  firstName?: string
  lastName?: string
  gender?: string
  image?: string
  accessToken: string
  refreshToken?: string
}

/** Raw shape returned by DummyJSON on a failed login (HTTP 400 etc). */
export interface LoginApiErrorResponse {
  message: string
}
