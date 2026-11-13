// src/services/execution.service.ts
import api from './api';
import { ApiResponse, WorkflowExecution } from '@/types';

export async function getExecution(id: string): Promise<WorkflowExecution> {
  const response = await api.get<ApiResponse<WorkflowExecution>>(`/executions/${id}`);
  return response.data.data;
}

export async function getExecutionAudit(id: string) {
  const response = await api.get<ApiResponse<any>>(`/executions/${id}/audit`);
  return response.data.data;
}

export async function retryExecution(id: string, reason?: string) {
  const response = await api.post<ApiResponse<any>>(`/executions/${id}/retry`, { reason });
  return response.data.data;
}
