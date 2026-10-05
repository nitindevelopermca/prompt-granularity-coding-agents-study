import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { login as requestLogin, type Session } from '../api/login'
import { readSession, writeSession } from './sessionStorage'

type AuthContextValue = {
  session: Session | null
  signIn: (username: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async signIn(username: string, password: string) {
        const next = await requestLogin(username, password)
        writeSession(next)
        setSession(next)
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
