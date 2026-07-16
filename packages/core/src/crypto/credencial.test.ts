import { describe, it, expect } from 'vitest'
import { cifrar, decifrar } from './credencial'
import crypto from 'node:crypto'

describe('Criptografia AES-256-GCM de Credenciais', () => {
  // Chave de 32 bytes (256 bits)
  const chave = crypto.randomBytes(32)

  it('deve cifrar e decifrar retornando o valor original', () => {
    const payload = 'meu_token_secreto_123'
    const { payloadCifrado, iv, authTag } = cifrar(payload, chave)
    
    expect(payloadCifrado).not.toBe(payload)
    expect(iv).toBeDefined()
    expect(authTag).toBeDefined()

    const decifrado = decifrar(payloadCifrado, iv, authTag, chave)
    expect(decifrado).toBe(payload)
  })

  it('deve gerar IVs diferentes para chamadas sucessivas com o mesmo payload e chave', () => {
    const payload = 'meu_token_secreto_123'
    
    const r1 = cifrar(payload, chave)
    const r2 = cifrar(payload, chave)
    
    expect(r1.iv).not.toBe(r2.iv)
    expect(r1.payloadCifrado).not.toBe(r2.payloadCifrado)
  })

  it('deve lançar erro se o authTag for adulterado', () => {
    const payload = 'meu_token_secreto_123'
    const { payloadCifrado, iv, authTag } = cifrar(payload, chave)

    // Adulterando 1 byte do authTag base64 (o primeiro caractere)
    const authTagAdulterado = (authTag.startsWith('A') ? 'B' : 'A') + authTag.substring(1)

    expect(() => {
      decifrar(payloadCifrado, iv, authTagAdulterado, chave)
    }).toThrow('Falha na decifragem da credencial. Integridade violada ou chave incorreta.')
  })
})
