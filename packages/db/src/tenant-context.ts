import { sql } from 'drizzle-orm'
import { db } from './index'
import { TENANT_SESSION_VAR } from './schema/rls'

export type TenantTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Toda query de negócio DEVE passar por aqui. Isso seta a variável de sessão que
 * as policies de RLS leem (ver schema/rls.ts) dentro de uma transação — nunca
 * `SET LOCAL` com interpolação de string (injeção de SQL); `set_config` aceita
 * bind parameter normalmente.
 */
export async function withTenant<T>(
  clienteId: string,
  callback: (tx: TenantTx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config(${TENANT_SESSION_VAR}, ${clienteId}, true)`,
    )
    return callback(tx)
  })
}
