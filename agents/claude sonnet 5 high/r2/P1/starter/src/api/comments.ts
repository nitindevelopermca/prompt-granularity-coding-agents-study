import { API_BASE_URL } from './config'

export interface AddCommentPayload {
  body: string
  postId: number
  userId: number
}

export interface AddCommentResponse {
  id: number
  body: string
  postId: number
}

/**
 * POST https://dummyjson.com/comments/add
 * DummyJSON simulates the create but does not persist it; the caller is
 * responsible for appending the comment to local frontend state.
 */
export async function addComment(payload: AddCommentPayload): Promise<AddCommentResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Network error while posting your comment. Please try again.')
  }
  if (!response.ok) {
    throw new Error('Could not post your comment. Please try again.')
  }
  return (await response.json()) as AddCommentResponse
}
