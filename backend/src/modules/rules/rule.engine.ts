// src/modules/rules/rule.engine.ts
// Orchestrates rule evaluation over a set of rules and input data.

import { evaluateRule } from './rule.evaluator';
import { RuleConfig, EngineResult, RuleEvaluationResult } from './rule.types';

/**
 * Evaluates a list of rules against the provided input data.
 *
 * Rules are sorted by priority (ascending) before evaluation.
 * Every active rule is evaluated to build a complete explainable trace.
 * If any rule fails with failureAction === 'REJECT', final decision is REJECTED.
 * Otherwise, if any rule fails with failureAction === 'MANUAL_REVIEW', final decision is MANUAL_REVIEW.
 * If all rules pass, final decision is APPROVED.
 */
export function evaluateRules(
  rules: RuleConfig[],
  inputData: Record<string, unknown>,
): EngineResult {
  // Only process active rules, ordered by priority ascending
  const activeRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => a.priority - b.priority);

  const ruleTrace: RuleEvaluationResult[] = [];
  let hasReject = false;
  let hasManualReview = false;
  let firstFailingRule: RuleConfig | undefined;

  for (const rule of activeRules) {
    const actual = getFieldValue(inputData, rule.field);
    const passed = evaluateRule(actual, rule.operator, rule.value);

    const traceEntry: RuleEvaluationResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      field: rule.field,
      operator: rule.operator,
      expectedValue: rule.value,
      actualValue: actual,
      passed,
      message: passed
        ? `Rule "${rule.name}" passed`
        : `Rule "${rule.name}" failed: field "${rule.field}" with value ${JSON.stringify(actual)} did not satisfy ${rule.operator} ${JSON.stringify(rule.value)}`,
      failureAction: passed ? undefined : rule.failureAction,
    };

    ruleTrace.push(traceEntry);

    if (!passed) {
      if (!firstFailingRule) {
        firstFailingRule = rule;
      }
      if (rule.failureAction === 'REJECT') {
        hasReject = true;
      } else if (rule.failureAction === 'MANUAL_REVIEW') {
        hasManualReview = true;
      }
    }
  }

  if (hasReject) {
    return {
      decision: 'REJECTED',
      summary: `Decision: REJECTED. Rule "${firstFailingRule?.name ?? 'Unknown'}" failed.`,
      ruleTrace,
      failedRule: firstFailingRule,
    };
  }

  if (hasManualReview) {
    return {
      decision: 'MANUAL_REVIEW',
      summary: `Decision: MANUAL_REVIEW. Rule "${firstFailingRule?.name ?? 'Unknown'}" requires manual verification.`,
      ruleTrace,
      failedRule: firstFailingRule,
    };
  }

  return {
    decision: 'APPROVED',
    summary: `All ${activeRules.length} rule(s) passed. Decision: APPROVED`,
    ruleTrace,
  };
}

/**
 * Resolves a dot-notation field path against the input data object.
 * E.g. "user.age" -> inputData.user.age
 */
function getFieldValue(
  data: Record<string, unknown>,
  field: string,
): unknown {
  const parts = field.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
