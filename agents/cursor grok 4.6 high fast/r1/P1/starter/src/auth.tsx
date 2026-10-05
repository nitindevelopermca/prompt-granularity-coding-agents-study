import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ApiError, isNetworkError, loginRequest } from './api'
import type { Session } from './types'

type AuthContextValue = {
  session: Session | null
  login: (username: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network error. Check your connection and try again.'
  }
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Unable to sign in'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await loginRequest(username, password)
      if (typeof result.id !== 'number' || !result.accessToken) {
        throw new Error('Login response was missing required session data.')
      }
      setSession({
        id: result.id,
        username: result.username,
        accessToken: result.accessToken,
      })
    } catch (error) {
      throw new Error(toErrorMessage(error))
    }
  }, [])

  const value = useMemo(() => ({ session, login }), [session, login])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
