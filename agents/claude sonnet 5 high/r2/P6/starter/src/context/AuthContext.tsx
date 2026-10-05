import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '../api/dummyjson'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'myshop.auth'

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (parsed && typeof parsed.id === 'number' && typeof parsed.accessToken === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

interface AuthContextValue {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password)
    const nextUser: AuthUser = {
      id: result.id,
      username: result.username,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    } catch {
      // Ignore storage failures (e.g. private browsing); session still works in-memory.
    }
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
