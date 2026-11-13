// src/components/common/StatusBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status?.toUpperCase()) {
    case 'APPROVED':
    case 'COMPLETED':
    case 'PUBLISHED':
    case 'SUCCESS':
      return (
        <Badge variant="success" className={className}>
          {status}
        </Badge>
      );

    case 'REJECTED':
    case 'FAILED':
    case 'PERMANENT_FAILURE':
      return (
        <Badge variant="danger" className={className}>
          {status}
        </Badge>
      );

    case 'MANUAL_REVIEW':
    case 'RETRY':
    case 'RETRYING':
    case 'TEMPORARY_FAILURE':
    case 'TIMEOUT':
    case 'DRAFT':
      return (
        <Badge variant="warning" className={className}>
          {status}
        </Badge>
      );

    case 'PROCESSING':
    case 'RUNNING':
    case 'VALIDATED':
      return (
        <Badge variant="info" className={className}>
          {status}
        </Badge>
      );

    case 'RECEIVED':
    case 'PENDING':
    default:
      return (
        <Badge variant="secondary" className={className}>
          {status || 'UNKNOWN'}
        </Badge>
      );
  }
}
