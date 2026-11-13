// src/modules/audit/audit.service.ts
import { Prisma } from '@prisma/client';
import * as auditRepository from './audit.repository';
import { CreateAuditLogInput, AuditLogFilter } from './audit.repository';

export async function log(
  input: CreateAuditLogInput,
  tx?: Prisma.TransactionClient,
) {
  return auditRepository.createAuditLog(input, tx);
}

export async function getAuditLogs(filter: AuditLogFilter) {
  return auditRepository.findAuditLogs(filter);
}
