import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginWithPassword } from './loginApi'
import { loadSession, saveSession } from './session'
import type { Session } from './types'

type AuthContextValue = {
  session: Session | null
  signIn: (username: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn: async (username: string, password: string) => {
        const next = await loginWithPassword(username, password)
        saveSession(next)
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
