// src/shared/enums/index.ts
// Application-wide enumerations.

export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  REVIEWER = 'REVIEWER',
  VIEWER = 'VIEWER',
}

export enum RequestStatus {
  RECEIVED = 'RECEIVED',
  VALIDATED = 'VALIDATED',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  RETRYING = 'RETRYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ExecutionStatus {
  RUNNING = 'RUNNING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  RETRY = 'RETRY',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum RuleOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GT = 'GT',
  GTE = 'GTE',
  LT = 'LT',
  LTE = 'LTE',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  EXISTS = 'EXISTS',
  NOT_EXISTS = 'NOT_EXISTS',
}

export enum SimulationMode {
  SUCCESS = 'SUCCESS',
  TEMPORARY_FAILURE = 'TEMPORARY_FAILURE',
  PERMANENT_FAILURE = 'PERMANENT_FAILURE',
}

export enum WorkflowVersionStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum RetryStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Decision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  PENDING = 'PENDING',
}
