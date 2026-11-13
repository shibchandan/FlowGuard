// src/modules/requests/request.schema.ts
import { z } from 'zod';

export const submitRequestSchema = z.object({
  workflowId: z.string().min(1, 'workflowId is required'),
  data: z.record(z.unknown()),
});
