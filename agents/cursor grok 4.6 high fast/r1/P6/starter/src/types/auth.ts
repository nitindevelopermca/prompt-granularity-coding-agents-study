export interface LoginRequest {
  username: string
  password: string
  expiresInMins?: number
}

export interface LoginSuccess {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  gender: string
  image: string
  accessToken: string
  refreshToken: string
}

export interface LoginErrorBody {
  message: string
}

export interface Session {
  id: number
  accessToken: string
  refreshToken?: string
  username?: string
}
