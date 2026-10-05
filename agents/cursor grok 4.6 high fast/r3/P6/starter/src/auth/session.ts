export type Session = {
  id: number
  accessToken: string
  refreshToken?: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
