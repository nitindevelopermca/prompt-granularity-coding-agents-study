import { createContext, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthSession, LoginSuccessResponse } from '../types/auth';

const STORAGE_KEY = 'myshop.auth.session';

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  /** Store the session from a successful login response (id + accessToken retained). */
  setSession: (response: LoginSuccessResponse) => void;
  /** Clear the current session (e.g. user logs out). */
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (typeof parsed.id !== 'number' || typeof parsed.accessToken !== 'string') {
      return null;
    }
    return {
      id: parsed.id,
      username: parsed.username ?? '',
      email: parsed.email ?? '',
      firstName: parsed.firstName ?? '',
      lastName: parsed.lastName ?? '',
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
    };
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null) {
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures (e.g. private browsing); session still works in-memory.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => readStoredSession());

  const setSession = useCallback((response: LoginSuccessResponse) => {
    // Retain at least id and accessToken, as required by the login work unit.
    const next: AuthSession = {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? null,
    };
    setSessionState(next);
    persistSession(next);
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    persistSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      setSession,
      clearSession,
    }),
    [session, setSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
