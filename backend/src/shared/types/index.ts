// src/shared/types/index.ts
// Shared TypeScript types and interfaces.

import { UserRole } from '../enums';
import { RuleConfig } from '../../modules/rules/rule.types';

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Request User ─────────────────────────────────────────────────────────────
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
}

// ─── Dependency Simulator ─────────────────────────────────────────────────────
export interface DependencyResult {
  success: boolean;
  message: string;
  retryable: boolean;
}

// ─── Workflow Config ──────────────────────────────────────────────────────────
export interface WorkflowConfig {
  inputSchema: Record<string, string>;
  rules: RuleConfig[];
  execution: {
    maxRetries: number;
  };
}
