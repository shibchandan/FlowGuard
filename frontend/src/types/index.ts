export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'REVIEWER' | 'VIEWER';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  latestVersion?: number;
  totalRequests?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  configuration: WorkflowConfig;
  config?: WorkflowConfig;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  createdAt: string;
}

export interface WorkflowConfig {
  inputSchema: Record<string, string>;
  rules: RuleConfig[];
  execution: { maxRetries: number };
}

export interface RuleConfig {
  id: string;
  name: string;
  field: string;
  operator: string;
  value?: unknown;
  priority: number;
  failureAction: 'REJECT' | 'MANUAL_REVIEW';
  isActive: boolean;
}

export interface Request {
  id: string;
  referenceNumber: string;
  workflowId: string;
  workflowName?: string;
  submittedBy?: string | { name: string; email: string };
  status: RequestStatus;
  inputData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus =
  | 'RECEIVED'
  | 'VALIDATED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED';

export interface WorkflowExecution {
  id: string;
  requestId: string;
  workflowVersionId: string;
  status: ExecutionStatus;
  currentStage?: string;
  decision?: string;
  decisionReason?: string;
  ruleTrace?: RuleEvaluationResult[];
  startedAt: string;
  completedAt?: string;
  retries?: RetryRecord[];
}

export type ExecutionStatus =
  | 'RUNNING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MANUAL_REVIEW'
  | 'RETRY'
  | 'COMPLETED'
  | 'FAILED';

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  field: string;
  operator: string;
  expectedValue: unknown;
  actualValue: unknown;
  passed: boolean;
  message: string;
  failureAction?: string;
}

export interface StateTransition {
  id: string;
  fromStatus?: string;
  toStatus: string;
  reason?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ManualReview {
  id: string;
  requestId: string;
  referenceNumber?: string;
  workflowName?: string;
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  assignedTo?: string;
  reviewer?: { name?: string; email?: string };
  reviewerComment?: string;
  reviewedAt?: string;
  createdAt: string;
  request?: Request;
  decisionExplanation?: { summary: string; ruleTrace?: RuleEvaluationResult[] };
}

export interface RetryRecord {
  id: string;
  executionId: string;
  attemptNumber: number;
  reason?: string;
  status: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingReviews: number;
  failedExecutions: number;
  retryingRequests: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}
