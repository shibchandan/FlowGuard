// src/modules/rules/rule.evaluator.ts
// Pure, side-effect-free rule evaluation logic.
// NO eval(), NO new Function().

import { RuleOperator } from '../../shared/enums';

/**
 * Evaluates a single rule operator against an actual value and an optional expected value.
 * Returns true if the rule passes, false otherwise.
 */
export function evaluateRule(
  actual: unknown,
  operator: RuleOperator,
  expected?: unknown,
): boolean {
  switch (operator) {
    case RuleOperator.EXISTS:
      return actual !== undefined && actual !== null;

    case RuleOperator.NOT_EXISTS:
      return actual === undefined || actual === null;

    case RuleOperator.EQUALS:
      return actual === expected;

    case RuleOperator.NOT_EQUALS:
      return actual !== expected;

    case RuleOperator.GT:
      return toNumber(actual) > toNumber(expected);

    case RuleOperator.GTE:
      return toNumber(actual) >= toNumber(expected);

    case RuleOperator.LT:
      return toNumber(actual) < toNumber(expected);

    case RuleOperator.LTE:
      return toNumber(actual) <= toNumber(expected);

    case RuleOperator.IN: {
      if (!Array.isArray(expected)) return false;
      return expected.includes(actual);
    }

    case RuleOperator.NOT_IN: {
      if (!Array.isArray(expected)) return true;
      return !expected.includes(actual);
    }

    default: {
      // TypeScript exhaustiveness guard
      const _exhaustive: never = operator;
      throw new Error(`Unknown operator: ${_exhaustive as string}`);
    }
  }
}

/**
 * Safely converts a value to a number for numeric comparisons.
 * Returns NaN for non-numeric values so comparisons fail gracefully.
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? NaN : parsed;
  }
  return NaN;
}
