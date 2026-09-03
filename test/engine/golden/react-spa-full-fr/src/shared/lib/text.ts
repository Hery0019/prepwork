// CORE-082 : le texte affiché passe toujours par ici. Sans i18n, la fonction est l'identité,
// ce qui rend l'activation ultérieure de l'i18n mécanique.
export { useTranslation } from 'react-i18next';
import { i18n } from '@shared/i18n/config';

export function t(key: string, fallback: string): string {
  return i18n.exists(key) ? i18n.t(key) : fallback;
}
