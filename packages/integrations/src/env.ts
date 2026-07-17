import { z } from 'zod'

const envSchema = z.object({
  ADAPTER_MODE: z.enum(['mock', 'real']).default('mock'),
  ERROR_RATE: z.coerce.number().min(0).max(1).default(0.05),
  // Credenciais do APP Bling (nível plataforma, sandbox) usadas no handshake OAuth2.
  // Opcionais: só exigidas em runtime quando ADAPTER_MODE=real e o adapter real do Bling é
  // efetivamente usado — mantê-las opcionais evita quebrar build/test sem elas configuradas.
  BLING_CLIENT_ID: z.string().optional(),
  BLING_CLIENT_SECRET: z.string().optional(),
  BLING_REDIRECT_URI: z.string().optional(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  throw new Error(`Invalid environment variables (integrations): ${JSON.stringify(_env.error.format())}`)
}

export const env = _env.data
