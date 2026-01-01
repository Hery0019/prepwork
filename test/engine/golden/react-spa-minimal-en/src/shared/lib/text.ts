// CORE-082: displayed text always goes through here. Without i18n the function is the identity,
// which makes enabling i18n later a mechanical change.
export function t(_key: string, fallback: string): string {
  return fallback;
}
