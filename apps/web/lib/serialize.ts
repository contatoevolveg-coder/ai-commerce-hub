/**
 * BigInt não é serializável por JSON.stringify. Converte recursivamente bigint → string
 * antes de cruzar a fronteira HTTP (rotas BFF). Server Components chamam os serviços
 * diretamente (sem HTTP), então não passam por aqui.
 */
export function serializarBigint<T>(valor: T): unknown {
  return JSON.parse(
    JSON.stringify(valor, (_chave, v) => (typeof v === 'bigint' ? v.toString() : v)),
  )
}
