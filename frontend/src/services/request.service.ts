// src/services/request.service.ts
import api from './api';
import { ApiResponse, Request, StateTransition } from '@/types';

export interface SubmitRequestPayload {
  workflowId: string;
  data: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface ListRequestsParams {
  page?: number;
  limit?: number;
  status?: string;
  workflowId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export async function submitRequest(payload: SubmitRequestPayload) {
  const headers: Record<string, string> = {};
  if (payload.idempotencyKey) {
    headers['Idempotency-Key'] = payload.idempotencyKey;
  }
  const response = await api.post<ApiResponse<any>>('/requests', payload, { headers });
  return response.data;
}

export async function listRequests(params: ListRequestsParams) {
  const response = await api.get<ApiResponse<Request[]>>('/requests', { params });
  return response.data;
}

export async function getRequest(id: string) {
  const response = await api.get<ApiResponse<any>>(`/requests/${id}`);
  return response.data.data;
}

export async function getRequestHistory(id: string): Promise<StateTransition[]> {
  const response = await api.get<ApiResponse<StateTransition[]>>(`/requests/${id}/history`);
  return response.data.data;
}
