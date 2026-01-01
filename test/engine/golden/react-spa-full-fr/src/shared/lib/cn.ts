// Composition conditionnelle de classes : une seule façon de le faire dans le projet.
import { clsx, type ClassValue } from 'clsx';

export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
