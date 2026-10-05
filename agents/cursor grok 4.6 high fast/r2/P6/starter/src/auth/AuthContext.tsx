import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginRequest } from './api'
import { clearSession, readSession, writeSession } from './storage'
import type { Session } from './types'

type AuthContextValue = {
  session: Session | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const login = useCallback(async (username: string, password: string) => {
    const user = await loginRequest(username, password)
    const nextSession: Session = {
      id: user.id,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    }
    writeSession(nextSession)
    setSession(nextSession)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, login, logout }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
