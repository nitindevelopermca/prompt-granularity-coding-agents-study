import { apiRequest } from './apiClient'
import type { AddCommentRequest, AddCommentResponse } from '../types'

export async function addComment(body: string, postId: number, userId: number): Promise<AddCommentResponse> {
  const payload: AddCommentRequest = { body, postId, userId }
  return apiRequest<AddCommentResponse>('/comments/add', {
    method: 'POST',
    body: payload,
  })
}
