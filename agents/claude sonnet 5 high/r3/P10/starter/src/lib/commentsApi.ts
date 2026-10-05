const ADD_COMMENT_URL = 'https://dummyjson.com/comments/add'

export class CommentApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CommentApiError'
  }
}

interface AddCommentResult {
  id: number
  body: string
  postId: number
}

/**
 * Posts a comment per spec/apis_contract/05_Add_Comment.md.
 * DummyJSON simulates the create and does not persist it; callers must
 * append the resulting review to local state on success.
 */
export async function addComment(body: string, postId: number, userId: number): Promise<AddCommentResult> {
  let response: Response
  try {
    response = await fetch(ADD_COMMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body, postId, userId }),
    })
  } catch {
    throw new CommentApiError('Network error while posting your comment. Please try again.')
  }

  if (!response.ok) {
    throw new CommentApiError('Failed to post your comment. Please try again.')
  }

  try {
    return (await response.json()) as AddCommentResult
  } catch {
    throw new CommentApiError('Unexpected response while posting your comment.')
  }
}
