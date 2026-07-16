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

export function getAtorPapelAtual(): string {
  // TODO(F5): substituir pelo papel da sessão Auth.js.
  return process.env.DEV_ATOR_PAPEL ?? 'admin'
}

export function getAtorIdAtual(): string {
  // TODO(F5): substituir pelo id do usuário da sessão Auth.js.
  return process.env.DEV_ATOR_ID ?? '00000000-0000-0000-0000-000000000002'
}
