// CORE-040 : la seule porte d'entrée du réseau. Les modules `api/` des features passent par ici.
import type { ZodType } from 'zod';
import 'server-only';
import { serverEnv } from '@shared/config/env';
import { authHeaders } from './serverAuth';
import { ApiError, errorKindForStatus } from './errors';

export interface RequestOptions<T> {
  /** Schéma appliqué à la réponse : CORE-041, rien n'entre sans validation. */
  schema: ZodType<T>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const { schema, method = 'GET', body } = options;

  const init: RequestInit = { method };
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  // NEXT-014 : la session vient de la requête entrante, pas d'un bocal à cookies du serveur.
  Object.assign(headers, await authHeaders());
  if (Object.keys(headers).length > 0) init.headers = headers;

  let response: Response;
  try {
    // NEXT-010 : l'URL de base ne quitte pas le serveur ; ce module n'est jamais importé côté client.
    response = await fetch(`${serverEnv().API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError('unavailable', 'Le service est injoignable.');
  }

  if (!response.ok) {
    // SECO-002 : une session expirée renvoie vers la connexion, jamais dans une boucle de réessai.
    if (response.status === 401) {
      throw new ApiError('unauthorized', 'La session a expiré.');
    }
    throw new ApiError(
      errorKindForStatus(response.status),
      `La requête a échoué (${response.status}).`,
    );
  }

  if (response.status === 204) return schema.parse(undefined);
  return schema.parse(await response.json());
}
