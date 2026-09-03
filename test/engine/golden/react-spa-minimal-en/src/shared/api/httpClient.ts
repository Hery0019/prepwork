// CORE-040: the single network entry point. The `api/` modules of the features go through it.
import type { ZodType } from 'zod';
import { env } from '@shared/config/env';
import { ApiError, errorKindForStatus } from './errors';

export interface RequestOptions<T> {
  /** Schema applied to the response: CORE-041, nothing enters unvalidated. */
  schema: ZodType<T>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const { schema, method = 'GET', body } = options;

  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, init);
  } catch {
    throw new ApiError('unavailable', 'The service is unreachable.');
  }

  if (!response.ok) {
    throw new ApiError(
      errorKindForStatus(response.status),
      `The request failed (${response.status}).`,
    );
  }

  if (response.status === 204) return schema.parse(undefined);
  return schema.parse(await response.json());
}
