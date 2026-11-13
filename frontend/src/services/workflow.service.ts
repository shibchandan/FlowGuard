import api from './api';
import { ApiResponse, Workflow, WorkflowVersion, WorkflowConfig } from '@/types';

export async function listWorkflows(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<Workflow[]>> {
  const response = await api.get<ApiResponse<Workflow[]>>('/workflows', { params });
  return response.data;
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const response = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`);
  return response.data.data;
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
}): Promise<Workflow> {
  const response = await api.post<ApiResponse<Workflow>>('/workflows', data);
  return response.data.data;
}

export async function updateWorkflow(
  id: string,
  data: { name?: string; description?: string; isActive?: boolean }
): Promise<Workflow> {
  const response = await api.put<ApiResponse<Workflow>>(`/workflows/${id}`, data);
  return response.data.data;
}

export async function getVersions(workflowId: string): Promise<WorkflowVersion[]> {
  const response = await api.get<ApiResponse<WorkflowVersion[]>>(
    `/workflows/${workflowId}/versions`
  );
  return response.data.data;
}

export async function getVersion(workflowId: string, versionId: string): Promise<WorkflowVersion> {
  const response = await api.get<ApiResponse<WorkflowVersion>>(
    `/workflows/${workflowId}/versions/${versionId}`
  );
  return response.data.data;
}

export async function createVersion(
  workflowId: string,
  configuration: WorkflowConfig
): Promise<WorkflowVersion> {
  const response = await api.post<ApiResponse<WorkflowVersion>>(
    `/workflows/${workflowId}/versions`,
    { configuration }
  );
  return response.data.data;
}

export async function updateVersion(
  workflowId: string,
  versionId: string,
  configuration: WorkflowConfig
): Promise<WorkflowVersion> {
  const response = await api.put<ApiResponse<WorkflowVersion>>(
    `/workflows/${workflowId}/versions/${versionId}`,
    { configuration }
  );
  return response.data.data;
}

export async function publishVersion(
  workflowId: string,
  versionId: string
): Promise<WorkflowVersion> {
  const response = await api.post<ApiResponse<WorkflowVersion>>(
    `/workflows/${workflowId}/versions/${versionId}/publish`
  );
  return response.data.data;
}
