// Bouton du projet. Copié dans le dépôt, donc modifiable : c'est tout l'intérêt de shadcn.
// CORE-011 : l'état désactivé et l'anneau de focus font partie du composant, pas de l'appelant.
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:opacity-90',
        secondary: 'border border-border bg-surface text-text',
        danger: 'bg-destructive text-primary-foreground hover:opacity-90',
      },
      size: {
        // CORE-034 : une cible interactive fait au moins 44 px de haut.
        md: 'h-11 px-4 text-base',
        sm: 'h-11 px-3 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />;
}
