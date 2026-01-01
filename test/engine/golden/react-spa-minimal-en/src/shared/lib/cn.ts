// Conditional class composition: one single way to do it in the project.
import { clsx, type ClassValue } from 'clsx';

export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
