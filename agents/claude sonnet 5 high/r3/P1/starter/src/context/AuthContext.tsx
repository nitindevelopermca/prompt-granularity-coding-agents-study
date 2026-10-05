import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, loginRequest } from '../api.ts'
import type { AuthUser } from '../types.ts'

interface AuthContextValue {
  user: AuthUser | null
  isLoggingIn: boolean
  loginError: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  clearLoginError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function login(username: string, password: string): Promise<boolean> {
    setIsLoggingIn(true)
    setLoginError(null)
    try {
      const response = await loginRequest(username, password)
      setUser({
        id: response.id,
        username: response.username,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        firstName: response.firstName,
        lastName: response.lastName,
        image: response.image,
      })
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
      setLoginError(message)
      return false
    } finally {
      setIsLoggingIn(false)
    }
  }

  function logout() {
    setUser(null)
  }

  function clearLoginError() {
    setLoginError(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoggingIn, loginError, login, logout, clearLoginError }),
    [user, isLoggingIn, loginError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
