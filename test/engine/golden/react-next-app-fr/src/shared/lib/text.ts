// CORE-082 : le texte affiché passe toujours par ici. Sans i18n, la fonction est l'identité,
// ce qui rend l'activation ultérieure de l'i18n mécanique.
export function t(_key: string, fallback: string): string {
  return fallback;
}
