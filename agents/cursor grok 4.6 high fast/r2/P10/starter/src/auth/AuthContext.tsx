import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loadSession, saveSession, type Session } from './session'

type AuthContextValue = {
  session: Session | null
  setSession: (session: Session) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => loadSession())

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      setSession: (next) => {
        saveSession(next)
        setSessionState(next)
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
