import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'

/**
 * Nome da variável de sessão Postgres usada para isolamento de tenant.
 * Setada por `withTenant()` (ver ../tenant-context.ts) via `SET LOCAL` no
 * início de toda transação. Nunca setada => `current_setting(..., true)`
 * retorna NULL => a policy falha fechado (nenhuma linha visível).
 */
export const TENANT_SESSION_VAR = 'app.current_cliente_id'

/**
 * Policy padrão de isolamento de tenant: toda linha só é visível/gravável quando
 * `cliente_id` bate com a variável de sessão da transação atual.
 */
export function tenantIsolationPolicy(nomePolicy: string) {
  return pgPolicy(nomePolicy, {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql`cliente_id = current_setting('${sql.raw(TENANT_SESSION_VAR)}', true)::uuid`,
    withCheck: sql`cliente_id = current_setting('${sql.raw(TENANT_SESSION_VAR)}', true)::uuid`,
  })
}

/** Variante para a própria tabela `cliente` (compara `id`, não `cliente_id`). */
export function selfTenantIsolationPolicy(nomePolicy: string) {
  return pgPolicy(nomePolicy, {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql`id = current_setting('${sql.raw(TENANT_SESSION_VAR)}', true)::uuid`,
    withCheck: sql`id = current_setting('${sql.raw(TENANT_SESSION_VAR)}', true)::uuid`,
  })
}
