import { DEV_CLIENTE_ID } from '@ai-commerce/db'

/**
 * Resolve o cliente_id (tenant) da requisição atual.
 *
 * TODO(F5): substituir pelo cliente_id da sessão Auth.js. Enquanto o RBAC não existe,
 * toda a app opera sobre o tenant de demonstração semeado por `pnpm db:seed`. O valor
 * pode ser sobrescrito por env (DEV_CLIENTE_ID) sem recompilar.
 */
export function getClienteIdAtual(): string {
  return process.env.DEV_CLIENTE_ID ?? DEV_CLIENTE_ID
}
