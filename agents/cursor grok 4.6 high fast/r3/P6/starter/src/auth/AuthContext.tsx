import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isRecord, type Session } from './session'

const STORAGE_KEY = 'myshop.session'

type AuthContextValue = {
  session: Session | null
  setSession: (session: Session) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (
      !isRecord(parsed) ||
      typeof parsed.id !== 'number' ||
      typeof parsed.accessToken !== 'string'
    ) {
      return null
    }

    const session: Session = {
      id: parsed.id,
      accessToken: parsed.accessToken,
    }

    if (typeof parsed.refreshToken === 'string') {
      session.refreshToken = parsed.refreshToken
    }

    return session
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(loadStoredSession)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      setSession(next) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
