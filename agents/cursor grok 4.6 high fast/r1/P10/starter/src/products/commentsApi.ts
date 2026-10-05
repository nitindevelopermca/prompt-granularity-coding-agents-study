const COMMENTS_URL = 'https://dummyjson.com/comments/add'

export class CommentRequestError extends Error {
  constructor(message = 'Unable to add your comment. Please try again.') {
    super(message)
    this.name = 'CommentRequestError'
  }
}

export async function addProductComment(body: string, postId: number, userId: number): Promise<void> {
  let response: Response

  try {
    response = await fetch(COMMENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    })
  } catch {
    throw new CommentRequestError('Unable to reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new CommentRequestError()
  }
}
