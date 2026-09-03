// Champ de saisie : le libellé fait partie du composant (CORE-031), le message d'erreur
// est relié au champ (CORE-052).
import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string | undefined;
}

export function Input({ label, error, className, ...props }: InputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        className={cn(
          'h-11 rounded-md border border-border bg-background px-3',
          error !== undefined && 'border-destructive',
          className,
        )}
        {...props}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
