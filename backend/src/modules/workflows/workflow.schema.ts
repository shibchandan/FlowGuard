// src/modules/workflows/workflow.schema.ts
import { z } from 'zod';
import { RuleOperator } from '../../shared/enums';

export const createWorkflowSchema = z.object({
  name: z.string().min(2, 'Workflow name must be at least 2 characters'),
  description: z.string().optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ruleConfigSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  name: z.string().min(1, 'Rule name is required'),
  field: z.string().min(1, 'Field name is required'),
  operator: z.nativeEnum(RuleOperator),
  value: z.unknown().optional(),
  priority: z.number().int().min(1, 'Priority must be a positive integer'),
  failureAction: z.enum(['REJECT', 'MANUAL_REVIEW']),
  isActive: z.boolean().default(true),
});

export const workflowConfigSchema = z.object({
  inputSchema: z.record(z.string()).default({}),
  rules: z.array(ruleConfigSchema).min(1, 'At least one rule is required'),
  execution: z.object({
    maxRetries: z.number().int().min(0).max(10).default(3),
  }).default({ maxRetries: 3 }),
});

export const createVersionSchema = z.object({
  configuration: workflowConfigSchema,
});
