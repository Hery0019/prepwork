// CORE-037: a status message is announced, not only coloured.
import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export interface AlertProps {
  tone?: 'info' | 'error' | 'success';
  title: string;
  children?: ReactNode;
}

const TONE = {
  info: 'border-border text-text',
  error: 'border-destructive text-destructive',
  success: 'border-success text-success',
} as const;

export function Alert({ tone = 'info', title, children }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-md border bg-surface p-4', TONE[tone])}
    >
      <p className="font-medium">{title}</p>
      {children !== undefined && <div className="text-muted">{children}</div>}
    </div>
  );
}
