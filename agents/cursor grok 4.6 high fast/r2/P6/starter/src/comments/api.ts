export class CommentNetworkError extends Error {
  readonly kind = 'network' as const

  constructor(message = 'Unable to reach the server. Check your connection and try again.') {
    super(message)
    this.name = 'CommentNetworkError'
  }
}

export class CommentRequestError extends Error {
  readonly kind = 'request' as const

  constructor(message = 'Unable to add your comment. Please try again.') {
    super(message)
    this.name = 'CommentRequestError'
  }
}

function readErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    const message = (value as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

export async function addComment(input: {
  body: string
  postId: number
  userId: number
}): Promise<void> {
  let response: Response

  try {
    response = await fetch('https://dummyjson.com/comments/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: input.body,
        postId: input.postId,
        userId: input.userId,
      }),
    })
  } catch {
    throw new CommentNetworkError()
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new CommentRequestError(readErrorMessage(payload, 'Unable to add your comment. Please try again.'))
  }
}
