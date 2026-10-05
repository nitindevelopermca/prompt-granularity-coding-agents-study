import type { Session } from './types'

const STORAGE_KEY = 'myshop.session'

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    return parseSession(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function parseSession(value: unknown): Session | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  if (typeof record.id !== 'number' || typeof record.accessToken !== 'string' || record.accessToken.length === 0) {
    return null
  }

  const session: Session = {
    id: record.id,
    accessToken: record.accessToken,
  }

  if (typeof record.refreshToken === 'string' && record.refreshToken.length > 0) {
    session.refreshToken = record.refreshToken
  }

  return session
}
