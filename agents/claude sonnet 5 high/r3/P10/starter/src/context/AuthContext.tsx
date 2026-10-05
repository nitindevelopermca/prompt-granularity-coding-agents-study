import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser, LoginApiResponse } from '../types/auth'

const STORAGE_KEY = 'myshop.auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  setUserFromLoginResponse: (response: LoginApiResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
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

function writeStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures (e.g. private browsing restrictions).
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const setUserFromLoginResponse = useCallback((response: LoginApiResponse) => {
    // Retain at least id and accessToken as required for cart/comment APIs.
    const nextUser: AuthUser = {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      image: response.image,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    }
    setUser(nextUser)
    writeStoredUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    writeStoredUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      setUserFromLoginResponse,
      logout,
    }),
    [user, setUserFromLoginResponse, logout],
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
