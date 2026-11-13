// src/modules/rules/rule.schema.ts
// Zod validation schemas for rule-related input.

import { z } from 'zod';
import { RuleOperator } from '../../shared/enums';

export const ruleConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  field: z.string().min(1),
  operator: z.nativeEnum(RuleOperator),
  value: z.unknown().optional(),
  priority: z.number().int().min(1),
  failureAction: z.enum(['REJECT', 'MANUAL_REVIEW']),
  isActive: z.boolean(),
});

export type RuleConfigInput = z.infer<typeof ruleConfigSchema>;
