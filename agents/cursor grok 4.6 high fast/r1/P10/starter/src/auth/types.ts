export type Session = {
  id: number
  accessToken: string
  refreshToken?: string
}

export type LoginErrorBody = {
  message?: string
}
