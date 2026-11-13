// src/modules/rules/rule.types.ts
// Rule engine type definitions.

import { RuleOperator } from '../../shared/enums';

export interface RuleConfig {
  id: string;
  name: string;
  field: string;
  operator: RuleOperator;
  value?: unknown;
  priority: number;
  failureAction: 'REJECT' | 'MANUAL_REVIEW';
  isActive: boolean;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  field: string;
  operator: RuleOperator;
  expectedValue: unknown;
  actualValue: unknown;
  passed: boolean;
  message: string;
  failureAction?: 'REJECT' | 'MANUAL_REVIEW';
}

export interface EngineResult {
  decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  summary: string;
  ruleTrace: RuleEvaluationResult[];
  failedRule?: RuleConfig;
}
