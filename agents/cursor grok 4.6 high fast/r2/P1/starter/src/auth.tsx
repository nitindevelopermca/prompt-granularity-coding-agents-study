import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginRequest } from './api'
import type { Session } from './types'

const STORAGE_KEY = 'myshop.session'

type AuthContextValue = {
  session: Session | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'accessToken' in parsed &&
      typeof parsed.id === 'number' &&
      typeof parsed.accessToken === 'string'
    ) {
      const record = parsed as Session
      return {
        id: record.id,
        accessToken: record.accessToken,
        username: typeof record.username === 'string' ? record.username : '',
        firstName: typeof record.firstName === 'string' ? record.firstName : '',
      }
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async login(username, password) {
        const next = await loginRequest(username, password)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setSession(next)
      },
      logout() {
        sessionStorage.removeItem(STORAGE_KEY)
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
