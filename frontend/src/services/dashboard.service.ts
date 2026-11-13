// src/services/dashboard.service.ts
import api from './api';
import { ApiResponse, DashboardSummary, AuditLog } from '@/types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
}

export async function getRecentActivity(page = 1, limit = 10) {
  const response = await api.get<ApiResponse<AuditLog[]>>('/dashboard/activity', {
    params: { page, limit },
  });
  return response.data;
}
