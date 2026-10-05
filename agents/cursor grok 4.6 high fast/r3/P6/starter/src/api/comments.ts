export const ADD_COMMENT_URL = 'https://dummyjson.com/comments/add'

export class CommentRequestError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'CommentRequestError'
    this.status = status
  }
}

export async function addComment(
  body: string,
  postId: number,
  userId: number,
): Promise<void> {
  let response: Response

  try {
    response = await fetch(ADD_COMMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body,
        postId,
        userId,
      }),
    })
  } catch {
    throw new CommentRequestError(
      'A network error occurred. Please check your connection and try again.',
    )
  }

  if (!response.ok) {
    throw new CommentRequestError(
      'Unable to add your comment. Please try again.',
      response.status,
    )
  }
}
