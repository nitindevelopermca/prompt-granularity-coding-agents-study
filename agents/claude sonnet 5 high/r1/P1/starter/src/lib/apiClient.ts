// Small fetch wrapper that normalizes DummyJSON errors into a single
// ApiError type so pages can show consistent, accessible error messages.

export const API_BASE = 'https://dummyjson.com'

export class ApiError extends Error {
  status?: number
  isNetworkError: boolean

  constructor(message: string, options?: { status?: number; isNetworkError?: boolean }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.isNetworkError = options?.isNetworkError ?? false
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', {
      isNetworkError: true,
    })
  }

  let payload: unknown = null
  const text = await response.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : undefined) ?? `Request failed with status ${response.status}.`
    throw new ApiError(message, { status: response.status })
  }

  return payload as T
}
