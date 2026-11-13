// src/components/common/ErrorState.tsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this section. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-destructive/20 rounded-lg bg-destructive/5 text-destructive">
      <AlertCircle className="w-8 h-8 mb-3" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-md mt-1 text-sm opacity-90">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 border-destructive/30 hover:bg-destructive/10 text-destructive"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}
