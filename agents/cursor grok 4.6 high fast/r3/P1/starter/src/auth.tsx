import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginRequest } from './api'
import type { AuthUser } from './types'

type AuthContextValue = {
  user: AuthUser | null
  signIn: (username: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signIn: async (username, password) => {
        const nextUser = await loginRequest(username, password)
        setUser(nextUser)
      },
    }),
    [user],
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
