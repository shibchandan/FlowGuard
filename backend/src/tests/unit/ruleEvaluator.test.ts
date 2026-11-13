// src/tests/unit/ruleEvaluator.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateRule } from '../../modules/rules/rule.evaluator';
import { evaluateRules } from '../../modules/rules/rule.engine';
import { RuleOperator } from '../../shared/enums';
import { RuleConfig } from '../../modules/rules/rule.types';

describe('Rule Evaluator - Operators', () => {
  describe('EQUALS', () => {
    it('returns true when values match strictly', () => {
      expect(evaluateRule('ACTIVE', RuleOperator.EQUALS, 'ACTIVE')).toBe(true);
      expect(evaluateRule(100, RuleOperator.EQUALS, 100)).toBe(true);
      expect(evaluateRule(true, RuleOperator.EQUALS, true)).toBe(true);
    });

    it('returns false when values differ', () => {
      expect(evaluateRule('ACTIVE', RuleOperator.EQUALS, 'INACTIVE')).toBe(false);
      expect(evaluateRule(100, RuleOperator.EQUALS, 200)).toBe(false);
    });
  });

  describe('NOT_EQUALS', () => {
    it('returns true when values differ', () => {
      expect(evaluateRule('A', RuleOperator.NOT_EQUALS, 'B')).toBe(true);
      expect(evaluateRule(10, RuleOperator.NOT_EQUALS, 20)).toBe(true);
    });

    it('returns false when values match', () => {
      expect(evaluateRule('A', RuleOperator.NOT_EQUALS, 'A')).toBe(false);
    });
  });

  describe('GT and GTE', () => {
    it('evaluates GT correctly', () => {
      expect(evaluateRule(750, RuleOperator.GT, 700)).toBe(true);
      expect(evaluateRule(700, RuleOperator.GT, 700)).toBe(false);
      expect(evaluateRule(650, RuleOperator.GT, 700)).toBe(false);
    });

    it('evaluates GTE correctly', () => {
      expect(evaluateRule(750, RuleOperator.GTE, 750)).toBe(true);
      expect(evaluateRule(760, RuleOperator.GTE, 750)).toBe(true);
      expect(evaluateRule(740, RuleOperator.GTE, 750)).toBe(false);
    });
  });

  describe('LT and LTE', () => {
    it('evaluates LT correctly', () => {
      expect(evaluateRule(50, RuleOperator.LT, 100)).toBe(true);
      expect(evaluateRule(100, RuleOperator.LT, 100)).toBe(false);
      expect(evaluateRule(150, RuleOperator.LT, 100)).toBe(false);
    });

    it('evaluates LTE correctly', () => {
      expect(evaluateRule(100, RuleOperator.LTE, 100)).toBe(true);
      expect(evaluateRule(90, RuleOperator.LTE, 100)).toBe(true);
      expect(evaluateRule(110, RuleOperator.LTE, 100)).toBe(false);
    });
  });

  describe('IN and NOT_IN', () => {
    it('evaluates IN correctly', () => {
      expect(evaluateRule('SALARIED', RuleOperator.IN, ['SALARIED', 'SELF_EMPLOYED'])).toBe(true);
      expect(evaluateRule('UNEMPLOYED', RuleOperator.IN, ['SALARIED', 'SELF_EMPLOYED'])).toBe(false);
      expect(evaluateRule('ANY', RuleOperator.IN, 'not-an-array')).toBe(false);
    });

    it('evaluates NOT_IN correctly', () => {
      expect(evaluateRule('STUDENT', RuleOperator.NOT_IN, ['BLOCKED', 'FRAUD'])).toBe(true);
      expect(evaluateRule('FRAUD', RuleOperator.NOT_IN, ['BLOCKED', 'FRAUD'])).toBe(false);
    });
  });

  describe('EXISTS and NOT_EXISTS', () => {
    it('evaluates EXISTS correctly', () => {
      expect(evaluateRule('present', RuleOperator.EXISTS)).toBe(true);
      expect(evaluateRule(0, RuleOperator.EXISTS)).toBe(true);
      expect(evaluateRule(false, RuleOperator.EXISTS)).toBe(true);
      expect(evaluateRule(null, RuleOperator.EXISTS)).toBe(false);
      expect(evaluateRule(undefined, RuleOperator.EXISTS)).toBe(false);
    });

    it('evaluates NOT_EXISTS correctly', () => {
      expect(evaluateRule(undefined, RuleOperator.NOT_EXISTS)).toBe(true);
      expect(evaluateRule(null, RuleOperator.NOT_EXISTS)).toBe(true);
      expect(evaluateRule('value', RuleOperator.NOT_EXISTS)).toBe(false);
    });
  });
});

describe('Rule Engine - Workflow Decisioning', () => {
  const sampleRules: RuleConfig[] = [
    {
      id: 'RULE_001',
      name: 'Minimum Age',
      field: 'age',
      operator: RuleOperator.GTE,
      value: 18,
      priority: 1,
      failureAction: 'REJECT',
      isActive: true,
    },
    {
      id: 'RULE_002',
      name: 'Minimum Credit Score',
      field: 'creditScore',
      operator: RuleOperator.GTE,
      value: 600,
      priority: 2,
      failureAction: 'REJECT',
      isActive: true,
    },
    {
      id: 'RULE_003',
      name: 'Credit Score Auto-Approval',
      field: 'creditScore',
      operator: RuleOperator.GTE,
      value: 750,
      priority: 3,
      failureAction: 'MANUAL_REVIEW',
      isActive: true,
    },
    {
      id: 'RULE_004',
      name: 'Minimum Income',
      field: 'monthlyIncome',
      operator: RuleOperator.GTE,
      value: 25000,
      priority: 4,
      failureAction: 'MANUAL_REVIEW',
      isActive: true,
    },
  ];

  it('approves an applicant meeting all criteria (Credit 780, Income 50k, Age 25)', () => {
    const input = {
      age: 25,
      creditScore: 780,
      monthlyIncome: 50000,
    };

    const result = evaluateRules(sampleRules, input);

    expect(result.decision).toBe('APPROVED');
    expect(result.ruleTrace).toHaveLength(4);
    expect(result.ruleTrace.every((t) => t.passed)).toBe(true);
  });

  it('rejects an applicant with low credit score (520)', () => {
    const input = {
      age: 25,
      creditScore: 520,
      monthlyIncome: 50000,
    };

    const result = evaluateRules(sampleRules, input);

    expect(result.decision).toBe('REJECTED');
    expect(result.failedRule?.id).toBe('RULE_002');
  });

  it('rejects an applicant underage (16)', () => {
    const input = {
      age: 16,
      creditScore: 800,
      monthlyIncome: 60000,
    };

    const result = evaluateRules(sampleRules, input);

    expect(result.decision).toBe('REJECTED');
    expect(result.failedRule?.id).toBe('RULE_001');
  });

  it('routes to manual review when credit score is between 600 and 749 (e.g. 650)', () => {
    const input = {
      age: 25,
      creditScore: 650,
      monthlyIncome: 35000,
    };

    const result = evaluateRules(sampleRules, input);

    expect(result.decision).toBe('MANUAL_REVIEW');
    // Rule 1 and 2 pass, Rule 3 fails with MANUAL_REVIEW
    const rule3Trace = result.ruleTrace.find((t) => t.ruleId === 'RULE_003');
    expect(rule3Trace?.passed).toBe(false);
    expect(rule3Trace?.failureAction).toBe('MANUAL_REVIEW');
  });

  it('handles nested field paths correctly', () => {
    const nestedRules: RuleConfig[] = [
      {
        id: 'RULE_NESTED',
        name: 'Nested City Check',
        field: 'address.city',
        operator: RuleOperator.EQUALS,
        value: 'Mumbai',
        priority: 1,
        failureAction: 'REJECT',
        isActive: true,
      },
    ];

    expect(evaluateRules(nestedRules, { address: { city: 'Mumbai' } }).decision).toBe('APPROVED');
    expect(evaluateRules(nestedRules, { address: { city: 'Delhi' } }).decision).toBe('REJECTED');
    expect(evaluateRules(nestedRules, {}).decision).toBe('REJECTED');
  });
});
