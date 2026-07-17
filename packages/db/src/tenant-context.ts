import { sql } from 'drizzle-orm'
import { db } from './index'
import { TENANT_SESSION_VAR } from './schema/rls'

export type TenantTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Toda query de negócio DEVE passar por aqui. Isso seta a variável de sessão que
 * as policies de RLS leem (ver schema/rls.ts) dentro de uma transação — nunca
 * `SET LOCAL` com interpolação de string (injeção de SQL); `set_config` aceita
 * bind parameter normalmente.
 *
 * `SET LOCAL ROLE app_role` (transaction-scoped, resetado no COMMIT/ROLLBACK):
 * a app conecta como `postgres` porque o pooler do Supabase (Supavisor) só
 * reconhece esse usuário — mas `postgres` tem BYPASSRLS, o que anularia o
 * isolamento de tenant. Trocar para `app_role` (sem BYPASSRLS, membro concedido
 * a postgres via `GRANT app_role TO postgres`) DENTRO da transação faz o RLS
 * voltar a valer para todas as queries do callback. Compatível com o modo
 * transaction do pooler (porta 6543), pois SET LOCAL é escopo de transação.
 * Em dev local a conexão já é `app_role`, então isto é um no-op (role → ela mesma).
 */
export async function withTenant<T>(
  clienteId: string,
  callback: (tx: TenantTx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config(${TENANT_SESSION_VAR}, ${clienteId}, true)`,
    )
    await tx.execute(sql`set local role app_role`)
    return callback(tx)
  })
}
