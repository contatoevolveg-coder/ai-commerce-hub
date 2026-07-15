import { z } from 'zod'

const envSchema = z.object({
  ADAPTER_MODE: z.enum(['mock', 'real']).default('mock'),
  ERROR_RATE: z.coerce.number().min(0).max(1).default(0.05),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  throw new Error(`Invalid environment variables (integrations): ${JSON.stringify(_env.error.format())}`)
}

export const env = _env.data
