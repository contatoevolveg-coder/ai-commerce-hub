import { DEV_CLIENTE_ID } from '@ai-commerce/db'
import { headers } from 'next/headers'

/**
 * Resolve o cliente_id (tenant) da requisição atual de forma SÍNCRONA.
 * Graças ao Middleware do Auth.js, toda rota protegida terá este header injetado,
 * permitindo saber qual é o tenant atual sem refatorar os controllers para async.
 */
export function getClienteIdAtual(): string {
  const tId = headers().get('x-tenant-id')
  return tId || process.env.DEV_CLIENTE_ID || DEV_CLIENTE_ID
}

export function getAtorPapelAtual(): string {
  return headers().get('x-user-role') || process.env.DEV_ATOR_PAPEL || 'admin'
}

export function getAtorIdAtual(): string {
  return headers().get('x-user-id') || process.env.DEV_ATOR_ID || '00000000-0000-0000-0000-000000000002'
}
