import api from './api';
import { ApiResponse, AuthResponse, User } from '@/types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
  return response.data.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore errors on logout
  } finally {
    localStorage.removeItem('flowguard_token');
    localStorage.removeItem('flowguard_user');
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}
