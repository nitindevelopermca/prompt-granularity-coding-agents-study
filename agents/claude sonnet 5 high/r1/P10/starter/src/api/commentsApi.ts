// Add-comment API client.
//
// Contract (spec/apis_contract/05_Add_Comment.md, spec/SPEC_FREEZE.md):
//   POST https://dummyjson.com/comments/add
//   Content-Type: application/json
//   body: { body, postId, userId }
//   DummyJSON simulates the create and does not persist it — callers are
//   responsible for appending the comment to local state after success.

const COMMENTS_URL = 'https://dummyjson.com/comments/add';

export interface AddCommentPayload {
  body: string;
  postId: number;
  userId: number;
}

export type CommentErrorKind = 'network' | 'unknown';

export class CommentError extends Error {
  kind: CommentErrorKind;

  constructor(message: string, kind: CommentErrorKind) {
    super(message);
    this.name = 'CommentError';
    this.kind = kind;
  }
}

/** Posts a comment. Resolves on HTTP success; the response body isn't needed
 * since the local review row is built from the submitted text/rating/user. */
export async function addComment(payload: AddCommentPayload): Promise<void> {
  let response: Response;

  try {
    response = await fetch(COMMENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CommentError(
      'Unable to reach the server. Please check your internet connection and try again.',
      'network',
    );
  }

  if (!response.ok) {
    throw new CommentError('Unable to post your comment right now. Please try again.', 'unknown');
  }
}
