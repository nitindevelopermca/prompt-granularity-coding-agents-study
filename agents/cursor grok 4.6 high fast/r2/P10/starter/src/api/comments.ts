export class CommentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommentError'
  }
}

export type AddCommentResult = {
  body: string
  reviewerName: string
}

export async function addProductComment(input: {
  body: string
  postId: number
  userId: number
}): Promise<AddCommentResult> {
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
    throw new CommentError('Unable to add your comment. Check your network and try again.')
  }

  if (!response.ok) {
    throw new CommentError('Unable to add your comment. Please try again.')
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new CommentError('Unable to add your comment. Please try again.')
  }

  if (typeof payload !== 'object' || payload === null) {
    return { body: input.body, reviewerName: 'You' }
  }

  const record = payload as Record<string, unknown>
  const body = typeof record.body === 'string' && record.body.length > 0 ? record.body : input.body
  let reviewerName = 'You'
  if (typeof record.user === 'object' && record.user !== null) {
    const user = record.user as Record<string, unknown>
    if (typeof user.username === 'string' && user.username.length > 0) {
      reviewerName = user.username
    }
  }

  return { body, reviewerName }
}
