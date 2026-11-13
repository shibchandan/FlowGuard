// src/services/simulator.service.ts
import api from './api';
import { ApiResponse } from '@/types';

export async function getSimulatorMode(): Promise<{ mode: string }> {
  const response = await api.get<ApiResponse<{ mode: string }>>('/admin/simulator');
  return response.data.data;
}

export async function updateSimulatorMode(mode: string): Promise<{ mode: string }> {
  const response = await api.put<ApiResponse<{ mode: string }>>('/admin/simulator', { mode });
  return response.data.data;
}
