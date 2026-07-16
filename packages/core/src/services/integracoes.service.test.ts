import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import crypto from 'node:crypto'
import { decifrar } from '../crypto/credencial'
import type { ErpTipo } from '../integracoes/catalogo-erp'
import {
  validarCredenciais,
  cifrarCredenciais,
  salvarCredencialErp,
  ChaveCriptografiaAusenteError,
} from './integracoes.service'

const chave = crypto.randomBytes(32)

describe('validarCredenciais', () => {
  it('aceita e limpa (trim) credenciais completas', () => {
    const r = validarCredenciais('bling', { clientId: ' abc ', clientSecret: 'xyz' })
    expect(r).toEqual({ clientId: 'abc', clientSecret: 'xyz' })
  })

  it('rejeita quando falta um campo obrigatório do ERP', () => {
    expect(() => validarCredenciais('bling', { clientId: 'abc' })).toThrow(/Client Secret/)
    expect(() => validarCredenciais('tiny', { token: '   ' })).toThrow(/Token/)
  })

  it('rejeita ERP não suportado', () => {
    expect(() => validarCredenciais('naoexiste' as unknown as ErpTipo, {})).toThrow(/não suportado/)
  })
})

describe('cifrarCredenciais (garantia de segurança)', () => {
  it('cifra as credenciais — o texto plano não aparece no payload e é recuperável', () => {
    const cred = { clientId: 'meu-client-id', clientSecret: 'super-secreto-123' }
    const { payloadCifrado, iv, authTag } = cifrarCredenciais('bling', cred, chave)

    expect(payloadCifrado).not.toContain('super-secreto-123')
    expect(payloadCifrado).not.toContain('meu-client-id')

    const recuperado = JSON.parse(decifrar(payloadCifrado, iv, authTag, chave))
    expect(recuperado).toEqual(cred)
  })

  it('gera IVs diferentes a cada chamada (não reusa IV com a mesma chave)', () => {
    const cred = { clientId: 'a', clientSecret: 'b' }
    const r1 = cifrarCredenciais('bling', cred, chave)
    const r2 = cifrarCredenciais('bling', cred, chave)
    expect(r1.iv).not.toBe(r2.iv)
    expect(r1.payloadCifrado).not.toBe(r2.payloadCifrado)
  })
})

describe('salvarCredencialErp sem chave configurada', () => {
  const original = process.env.CREDENTIAL_ENCRYPTION_KEY
  beforeEach(() => {
    delete process.env.CREDENTIAL_ENCRYPTION_KEY
  })
  afterEach(() => {
    if (original !== undefined) process.env.CREDENTIAL_ENCRYPTION_KEY = original
  })

  it('lança ChaveCriptografiaAusenteError antes de tocar o banco', () => {
    expect(() =>
      salvarCredencialErp('c1', {
        erp: 'bling',
        rotulo: 'Bling',
        credenciais: { clientId: 'a', clientSecret: 'b' },
      }),
    ).toThrow(ChaveCriptografiaAusenteError)
  })
})
