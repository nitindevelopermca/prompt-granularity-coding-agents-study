import { API_BASE } from './config'
import { ApiError } from './errors'

export interface AddCommentResult {
  id: number
  body: string
}

/**
 * POST https://dummyjson.com/comments/add
 * spec/apis_contract/05_Add_Comment.md
 * DummyJSON simulates the create and does not persist it — the caller is
 * responsible for appending the comment to frontend state after success.
 */
export async function addComment(body: string, postId: number, userId: number): Promise<AddCommentResult> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    })
  } catch {
    throw new ApiError('Network error while posting your comment. Please try again.')
  }

  if (!response.ok) {
    throw new ApiError('Failed to post your comment. Please try again.', response.status)
  }

  return (await response.json()) as AddCommentResult
}
