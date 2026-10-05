export const ADD_COMMENT_URL = 'https://dummyjson.com/comments/add'

export type CommentFailureKind = 'network' | 'unknown'

export class CommentRequestError extends Error {
  readonly kind: CommentFailureKind

  constructor(message: string, kind: CommentFailureKind) {
    super(message)
    this.name = 'CommentRequestError'
    this.kind = kind
  }
}

export interface AddCommentRequest {
  body: string
  postId: number
  userId: number
}

export async function addComment(payload: AddCommentRequest): Promise<void> {
  let response: Response
  try {
    response = await fetch(ADD_COMMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new CommentRequestError(
      'Unable to connect. Please check your network and try again.',
      'network',
    )
  }

  if (!response.ok) {
    throw new CommentRequestError(
      'Unable to add your comment. Existing reviews are unchanged.',
      'unknown',
    )
  }
}
