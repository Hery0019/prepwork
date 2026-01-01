// CORE-046: every environment value is read here, validated, and nowhere else.
import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
});

const source = import.meta.env;

const parsed = EnvSchema.safeParse(source);
if (!parsed.success) {
  throw new Error(
    "Missing or invalid environment variables: " +
      parsed.error.issues.map((issue) => issue.path.join('.')).join(', '),
  );
}

export const env = {
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
} as const;
