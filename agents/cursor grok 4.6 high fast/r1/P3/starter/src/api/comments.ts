export class CommentRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommentRequestError'
  }
}

export async function addComment(body: string, postId: number, userId: number): Promise<void> {
  let response: Response
  try {
    response = await fetch('https://dummyjson.com/comments/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    })
  } catch {
    throw new CommentRequestError('Unable to reach the server. Check your connection and try again.')
  }

  if (!response.ok) {
    throw new CommentRequestError('Unable to add your comment. Please try again.')
  }
}
