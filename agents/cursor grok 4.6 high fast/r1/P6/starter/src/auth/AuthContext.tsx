import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginWithPassword } from '../api/login'
import type { Session } from '../types/auth'
import { clearSession, readSession, writeSession } from './sessionStore'

interface AuthContextValue {
  session: Session | null
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async signIn(username: string, password: string) {
        const user = await loginWithPassword(username, password)
        const next: Session = {
          id: user.id,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          username: user.username,
        }
        writeSession(next)
        setSession(next)
      },
      signOut() {
        clearSession()
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
