import type { Session } from '../api/login'

const STORAGE_KEY = 'myshop.session'

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('id' in value) || !('accessToken' in value)) {
    return false
  }
  return (
    typeof value.id === 'number' &&
    Number.isFinite(value.id) &&
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0
  )
}

export function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return isSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}
