export type Session = {
  id: number
  accessToken: string
  refreshToken?: string
  username?: string
  firstName?: string
  lastName?: string
}

export type LoginSuccess = {
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

export class NetworkError extends Error {
  readonly kind = 'network' as const

  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class InvalidCredentialsError extends Error {
  readonly kind = 'invalid-credentials' as const

  constructor(message = 'Invalid credentials') {
    super(message)
    this.name = 'InvalidCredentialsError'
  }
}

export class LoginRequestError extends Error {
  readonly kind = 'request' as const

  constructor(message = 'Unable to sign in. Please try again.') {
    super(message)
    this.name = 'LoginRequestError'
  }
}
