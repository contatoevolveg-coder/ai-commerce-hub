/**
 * Carregamento e validação da chave de criptografia do ambiente, compartilhado por
 * todos os serviços que cifram segredos (cofre de credenciais ERP e tokens OAuth).
 * Lida direto com process.env (não via o barrel env.ts) para não exigir DATABASE_URL
 * só para cifrar — e para ser testável isolada. NUNCA loga o valor da chave.
 */

export class ChaveCriptografiaAusenteError extends Error {
  constructor(msg?: string) {
    super(
      msg ??
        'CREDENTIAL_ENCRYPTION_KEY não configurada. Gere uma (openssl rand -base64 32) e defina no ' +
          'ambiente antes de conectar um ERP.',
    )
    this.name = 'ChaveCriptografiaAusenteError'
  }
}

export function obterChave(): Buffer {
  const b64 = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!b64) throw new ChaveCriptografiaAusenteError()
  const chave = Buffer.from(b64.trim(), 'base64')
  if (chave.length !== 32) {
    throw new ChaveCriptografiaAusenteError(
      `CREDENTIAL_ENCRYPTION_KEY inválida: decodificou para ${chave.length} bytes, esperado 32. ` +
        'Verifique se a chave foi copiada corretamente (sem espaços ou quebras de linha).',
    )
  }
  return chave
}
