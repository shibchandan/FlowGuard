// src/components/common/EmptyState.tsx
import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-card/50">
      <div className="p-3 mb-4 rounded-full bg-muted text-muted-foreground">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-sm mt-1 text-sm text-muted-foreground">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="mt-4" size="sm">
          {actionText}
        </Button>
      )}
    </div>
  );
}
