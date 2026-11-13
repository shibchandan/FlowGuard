// src/services/audit.service.ts
import api from './api';
import { ApiResponse, AuditLog } from '@/types';

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export async function listAuditLogs(params: ListAuditLogsParams) {
  const response = await api.get<ApiResponse<AuditLog[]>>('/audit', { params });
  return response.data;
}
