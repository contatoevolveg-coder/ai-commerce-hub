import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // TODO(F8): tornar obrigatório quando o fluxo real de credencial existir
  CREDENTIAL_ENCRYPTION_KEY: z.string().min(44).optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // Nunca logar o payload falho inteiro para evitar vazar credenciais ou chaves
  throw new Error(`Invalid environment variables in core: ${JSON.stringify(_env.error.format())}`);
}

export const env = _env.data;
