// src/tests/unit/stateMachine.test.ts
import { describe, it, expect } from 'vitest';
import { RequestStatus, ExecutionStatus } from '../../shared/enums';

// State transition rules definition
const ALLOWED_REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.RECEIVED]: [RequestStatus.VALIDATED, RequestStatus.FAILED],
  [RequestStatus.VALIDATED]: [RequestStatus.PROCESSING, RequestStatus.FAILED],
  [RequestStatus.PROCESSING]: [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.MANUAL_REVIEW,
    RequestStatus.RETRYING,
    RequestStatus.FAILED,
  ],
  [RequestStatus.RETRYING]: [RequestStatus.PROCESSING, RequestStatus.FAILED, RequestStatus.RETRYING],
  [RequestStatus.MANUAL_REVIEW]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [RequestStatus.COMPLETED],
  [RequestStatus.REJECTED]: [RequestStatus.COMPLETED],
  [RequestStatus.FAILED]: [RequestStatus.RETRYING],
  [RequestStatus.COMPLETED]: [],
};

function isValidRequestTransition(from: RequestStatus, to: RequestStatus): boolean {
  const allowed = ALLOWED_REQUEST_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

describe('State Machine - Request Lifecycle Transitions', () => {
  it('allows valid forward transitions', () => {
    expect(isValidRequestTransition(RequestStatus.RECEIVED, RequestStatus.VALIDATED)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.VALIDATED, RequestStatus.PROCESSING)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.PROCESSING, RequestStatus.APPROVED)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.APPROVED, RequestStatus.COMPLETED)).toBe(true);
  });

  it('allows manual review and failure transitions', () => {
    expect(isValidRequestTransition(RequestStatus.PROCESSING, RequestStatus.MANUAL_REVIEW)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.MANUAL_REVIEW, RequestStatus.APPROVED)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.MANUAL_REVIEW, RequestStatus.REJECTED)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.PROCESSING, RequestStatus.RETRYING)).toBe(true);
    expect(isValidRequestTransition(RequestStatus.FAILED, RequestStatus.RETRYING)).toBe(true);
  });

  it('rejects invalid backward or terminal transitions', () => {
    expect(isValidRequestTransition(RequestStatus.COMPLETED, RequestStatus.PROCESSING)).toBe(false);
    expect(isValidRequestTransition(RequestStatus.COMPLETED, RequestStatus.RECEIVED)).toBe(false);
    expect(isValidRequestTransition(RequestStatus.RECEIVED, RequestStatus.APPROVED)).toBe(false);
    expect(isValidRequestTransition(RequestStatus.VALIDATED, RequestStatus.COMPLETED)).toBe(false);
  });
});
