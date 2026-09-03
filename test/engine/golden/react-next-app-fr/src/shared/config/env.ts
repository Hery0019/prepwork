// CORE-046 : toute valeur d'environnement est lue ici, validée, et nulle part ailleurs.
// CORE-070 : seules les variables `NEXT_PUBLIC_*` atteignent le navigateur ; les autres
// restent côté serveur et ne sont lisibles que dans un composant serveur ou une action.
import { z } from 'zod';

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_AUTH_LOGIN_PATH: z.string().startsWith('/'),
});

const ServerEnvSchema = z.object({
  API_BASE_URL: z.string().url(),
});

function parse<T>(schema: z.ZodType<T>, source: unknown, scope: string): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Variables d'environnement ${scope} manquantes ou invalides : ` +
        result.error.issues.map((issue) => issue.path.join('.')).join(', '),
    );
  }
  return result.data;
}

/** Lisible partout, y compris dans le navigateur. */
export const publicEnv = parse(
  PublicEnvSchema,
  {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_AUTH_LOGIN_PATH: process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH,
  },
  'publiques',
);

/** Ne doit être appelé que depuis un composant serveur, une action ou un route handler. */
export function serverEnv() {
  return parse(ServerEnvSchema, { API_BASE_URL: process.env.API_BASE_URL }, 'serveur');
}
