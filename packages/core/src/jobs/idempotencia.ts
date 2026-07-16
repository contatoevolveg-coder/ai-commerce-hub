import crypto from 'node:crypto'

/**
 * Gera um ID de idempotência determinístico combinando o Tenant (clienteId)
 * e o payload do job. Isso garante que payloads iguais de tenants diferentes
 * gerem hashes diferentes, mantendo o isolamento, mas evita que o MESMO
 * tenant enfileire exatamente o mesmo trabalho em duplicidade.
 */
export function gerarIdIdempotencia(clienteId: string, payload: unknown): string {
  const hash = crypto.createHash('sha256')
  hash.update(clienteId)
  hash.update('::')
  // Stringify with sorted keys is generally better, but standard JSON.stringify
  // works if we consistently construct the payload object.
  hash.update(JSON.stringify(payload))
  return hash.digest('hex')
}
