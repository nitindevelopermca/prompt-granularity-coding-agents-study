// Add-comment API client (simulated create; DummyJSON does not persist it).
// Contract: spec/apis_contract/05_Add_Comment.md, spec/SPEC_FREEZE.md
//   POST https://dummyjson.com/comments/add
//   Body: { body, postId, userId }
// After a successful POST the caller appends the comment to that product's
// review list in frontend state (this module does not do that itself).

import { API_BASE_URL } from './config';

export const COMMENT_ERROR_MESSAGES = {
  network: 'Network error. Please check your connection and try again.',
  api: 'Failed to add your comment. Please try again.',
  unexpected: 'Unexpected response from server. Please try again.',
} as const;

export class CommentError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CommentError';
    this.status = status;
  }
}

export interface AddCommentPayload {
  body: string;
  postId: number;
  userId: number;
}

export async function addComment(payload: AddCommentPayload): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/comments/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CommentError(COMMENT_ERROR_MESSAGES.network);
  }

  if (!response.ok) {
    throw new CommentError(COMMENT_ERROR_MESSAGES.api, response.status);
  }

  // DummyJSON echoes a created-comment object, but it does not persist and
  // we synthesize the locally displayed review row ourselves, so the body
  // is intentionally unused here.
}
