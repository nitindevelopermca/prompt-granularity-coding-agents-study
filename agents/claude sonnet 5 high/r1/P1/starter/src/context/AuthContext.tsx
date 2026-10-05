import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '../types'
import { login as loginRequest } from '../lib/auth'

const STORAGE_KEY = 'myshop.auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoggingIn: boolean
  loginError: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  clearLoginError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed?.id === 'number' && typeof parsed?.accessToken === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    setIsLoggingIn(true)
    setLoginError(null)
    try {
      const authUser = await loginRequest(username, password)
      setUser(authUser)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      } catch {
        // Ignore storage failures (e.g. private browsing); session still works in memory.
      }
      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setLoginError(message)
      return false
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage failures.
    }
  }, [])

  const clearLoginError = useCallback(() => setLoginError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoggingIn,
      loginError,
      login,
      logout,
      clearLoginError,
    }),
    [user, isLoggingIn, loginError, login, logout, clearLoginError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
