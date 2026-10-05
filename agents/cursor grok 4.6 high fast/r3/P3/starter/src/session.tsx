import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Session } from './types'

const STORAGE_KEY = 'myshop.session'

const AuthContext = createContext<AuthContextValue | null>(null)

type AuthContextValue = {
  session: Session | null
  setSession: (session: Session) => void
}

function readStoredSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    const record = parsed as Record<string, unknown>
    if (typeof record.id !== 'number' || typeof record.accessToken !== 'string' || !record.accessToken) {
      return null
    }
    const session: Session = {
      id: record.id,
      accessToken: record.accessToken,
    }
    if (typeof record.refreshToken === 'string' && record.refreshToken) {
      session.refreshToken = record.refreshToken
    }
    return session
  } catch {
    return null
  }
}

function persistSession(session: Session): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(readStoredSession)

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      setSession: (next: Session) => {
        persistSession(next)
        setSessionState(next)
      },
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
