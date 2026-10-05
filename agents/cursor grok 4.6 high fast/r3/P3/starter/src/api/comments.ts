export type AddCommentResult =
  | { ok: true }
  | { ok: false; kind: 'network' | 'unknown'; message: string }

export async function addProductComment(body: string, postId: number, userId: number): Promise<AddCommentResult> {
  try {
    const response = await fetch('https://dummyjson.com/comments/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, postId, userId }),
    })

    if (!response.ok) {
      return {
        ok: false,
        kind: 'unknown',
        message: 'Unable to add your comment right now. Please try again.',
      }
    }

    return { ok: true }
  } catch {
    return {
      ok: false,
      kind: 'network',
      message: 'Unable to reach the server. Check your connection and try again.',
    }
  }
}
