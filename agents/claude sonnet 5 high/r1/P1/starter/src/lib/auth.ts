import { apiRequest } from './apiClient'
import type { AuthUser, LoginRequest } from '../types'

interface LoginApiResponse {
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

export async function login(username: string, password: string): Promise<AuthUser> {
  const body: LoginRequest = { username, password, expiresInMins: 60 }
  const data = await apiRequest<LoginApiResponse>('/auth/login', {
    method: 'POST',
    body,
  })

  return {
    id: data.id,
    username: data.username,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    firstName: data.firstName,
    lastName: data.lastName,
    image: data.image,
  }
}
