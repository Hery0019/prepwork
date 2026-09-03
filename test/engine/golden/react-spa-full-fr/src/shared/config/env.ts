// CORE-046 : toute valeur d'environnement est lue ici, validée, et nulle part ailleurs.
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_AUTH_LOGIN_PATH: z.string().startsWith('/'),
});

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, string>;
  }
}

// DOCK-003 : la configuration injectée au démarrage du conteneur prime sur celle du build.
const source = { ...import.meta.env, ...(window.__RUNTIME_CONFIG__ ?? {}) };

const parsed = EnvSchema.safeParse(source);
if (!parsed.success) {
  throw new Error(
    "Variables d'environnement manquantes ou invalides : " +
      parsed.error.issues.map((issue) => issue.path.join('.')).join(', '),
  );
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  authLoginPath: parsed.data.VITE_AUTH_LOGIN_PATH,
} as const;
