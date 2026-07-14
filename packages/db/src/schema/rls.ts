import { sql } from 'drizzle-orm'
import { pgPolicy } from 'drizzle-orm/pg-core'

/**
 * Nome da variável de sessão Postgres usada para isolamento de tenant.
 * Setada por `withTenant()` (ver ../tenant-context.ts) via `set_config(..., true)`
 * (equivalente a SET LOCAL) no início de toda transação.
 */
export const TENANT_SESSION_VAR = 'app.current_cliente_id'

/**
 * IMPORTANTE: current_setting(x, true) só retorna NULL da PRIMEIRA vez que uma GUC
 * customizada nunca foi setada nesta conexão física. Numa conexão com pool (o caso
 * real da aplicação), depois que qualquer transação já setou a variável (via
 * set_config(..., true) = SET LOCAL) e comitou, ela reverte para STRING VAZIA, não
 * NULL, nas próximas queries na mesma conexão reciclada — confirmado empiricamente
 * contra Postgres 17 (Supabase). Um `::uuid` direto sobre isso lança
 * "invalid input syntax for type uuid" em vez de falhar fechado silenciosamente.
 * `nullif(..., '')` normaliza os dois casos (nunca setada E setada-e-revertida)
 * para NULL antes do cast, então a policy sempre falha fechado (0 linhas), nunca
 * lança erro.
 */
function currentTenantId() {
  return sql`nullif(current_setting('${sql.raw(TENANT_SESSION_VAR)}', true), '')::uuid`
}

/**
 * Policy padrão de isolamento de tenant: toda linha só é visível/gravável quando
 * `cliente_id` bate com a variável de sessão da transação atual.
 */
export function tenantIsolationPolicy(nomePolicy: string) {
  return pgPolicy(nomePolicy, {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql`cliente_id = ${currentTenantId()}`,
    withCheck: sql`cliente_id = ${currentTenantId()}`,
  })
}

/** Variante para a própria tabela `cliente` (compara `id`, não `cliente_id`). */
export function selfTenantIsolationPolicy(nomePolicy: string) {
  return pgPolicy(nomePolicy, {
    as: 'permissive',
    for: 'all',
    to: 'public',
    using: sql`id = ${currentTenantId()}`,
    withCheck: sql`id = ${currentTenantId()}`,
  })
}
