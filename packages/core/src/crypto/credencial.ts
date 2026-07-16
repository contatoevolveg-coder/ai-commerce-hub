import crypto from 'node:crypto'

export function cifrar(
  payloadPlano: string,
  chave: Buffer
): { payloadCifrado: string; iv: string; authTag: string } {
  // IV aleatório de 12 bytes a cada chamada (padrão seguro para GCM)
  const ivBuffer = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', chave, ivBuffer)

  let payloadCifrado = cipher.update(payloadPlano, 'utf8', 'base64')
  payloadCifrado += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return {
    payloadCifrado,
    iv: ivBuffer.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

export function decifrar(
  payloadCifrado: string,
  iv: string,
  authTag: string,
  chave: Buffer
): string {
  try {
    const ivBuffer = Buffer.from(iv, 'base64')
    const authTagBuffer = Buffer.from(authTag, 'base64')

    const decipher = crypto.createDecipheriv('aes-256-gcm', chave, ivBuffer)
    decipher.setAuthTag(authTagBuffer)

    let payloadPlano = decipher.update(payloadCifrado, 'base64', 'utf8')
    payloadPlano += decipher.final('utf8')

    return payloadPlano
  } catch (error) {
    // Nunca logar erro com o payload ou tag. Apenas lançar erro claro de integridade.
    throw new Error('Falha na decifragem da credencial. Integridade violada ou chave incorreta.')
  }
}
