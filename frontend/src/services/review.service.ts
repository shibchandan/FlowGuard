// src/services/review.service.ts
import api from './api';
import { ApiResponse, ManualReview } from '@/types';

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  status?: string;
  assignedToMe?: boolean;
}

export async function listReviews(params: ListReviewsParams) {
  const response = await api.get<ApiResponse<ManualReview[]>>('/reviews', { params });
  return response.data;
}

export async function getReview(id: string): Promise<ManualReview> {
  const response = await api.get<ApiResponse<ManualReview>>(`/reviews/${id}`);
  return response.data.data;
}

export async function submitReviewDecision(
  id: string,
  decision: 'APPROVED' | 'REJECTED',
  comment: string,
) {
  const response = await api.post<ApiResponse<any>>(`/reviews/${id}/decision`, {
    decision,
    comment,
  });
  return response.data.data;
}
