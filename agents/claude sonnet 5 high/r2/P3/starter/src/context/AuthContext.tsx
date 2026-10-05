import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'myshop.auth'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (typeof parsed.id === 'number' && typeof parsed.accessToken === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => readStoredUser())

  function setUser(next: AuthUser) {
    setUserState(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage may be unavailable (e.g. private mode) — session still works in-memory.
    }
  }

  function logout() {
    setUserState(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors on logout.
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, setUser, logout }),
    [user],
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
