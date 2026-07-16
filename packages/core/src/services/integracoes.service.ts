import { and, eq } from 'drizzle-orm'
import { withTenant, conexaoErp } from '@ai-commerce/db'
import { cifrar, decifrar } from '../crypto/credencial'
import { getErpCatalogo, type ErpTipo } from '../integracoes/catalogo-erp'

export class ChaveCriptografiaAusenteError extends Error {
  constructor() {
    super(
      'CREDENTIAL_ENCRYPTION_KEY não configurada. Gere uma (openssl rand -base64 32) e defina no ' +
        'ambiente antes de conectar um ERP.',
    )
    this.name = 'ChaveCriptografiaAusenteError'
  }
}

/**
 * Lê e valida a chave de criptografia do ambiente. Lida diretamente com process.env (não via
 * o barrel env.ts) para não exigir DATABASE_URL só para cifrar — e para ser testável isolada.
 * NUNCA loga o valor da chave.
 */
function obterChave(): Buffer {
  const b64 = process.env.CREDENTIAL_ENCRYPTION_KEY
  if (!b64) throw new ChaveCriptografiaAusenteError()
  const chave = Buffer.from(b64, 'base64')
  if (chave.length !== 32) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY inválida: deve decodificar para 32 bytes (256 bits).')
  }
  return chave
}

/**
 * Valida que as credenciais têm exatamente os campos exigidos pelo ERP (nenhum obrigatório
 * vazio) e retorna a versão limpa (trim). Função pura.
 */
export function validarCredenciais(
  erp: ErpTipo,
  credenciais: Record<string, string>,
): Record<string, string> {
  const catalogo = getErpCatalogo(erp)
  if (!catalogo) throw new Error(`ERP não suportado: ${erp}`)

  const limpo: Record<string, string> = {}
  for (const campo of catalogo.campos) {
    const valor = credenciais[campo.chave]
    if (typeof valor !== 'string' || valor.trim() === '') {
      throw new Error(`Campo obrigatório ausente para ${catalogo.nome}: ${campo.rotulo}.`)
    }
    limpo[campo.chave] = valor.trim()
  }
  return limpo
}

/**
 * Valida + cifra as credenciais de um ERP. Função pura (recebe a chave), separada do I/O para
 * ser testável sem banco. É aqui que a garantia de segurança vive: o retorno é sempre cifrado.
 */
export function cifrarCredenciais(
  erp: ErpTipo,
  credenciais: Record<string, string>,
  chave: Buffer,
): { payloadCifrado: string; iv: string; authTag: string } {
  const limpo = validarCredenciais(erp, credenciais)
  return cifrar(JSON.stringify(limpo), chave)
}

export interface ConexaoErpResumo {
  id: string
  erp: ErpTipo
  rotulo: string
  status: 'conectado' | 'desconectado' | 'erro'
  atualizadoEm: Date
}

/** Lista as conexões de ERP do tenant SEM credencial (nunca decifra numa listagem). */
export function listarConexoesErp(clienteId: string): Promise<ConexaoErpResumo[]> {
  return withTenant(clienteId, async (tx) => {
    return await tx
      .select({
        id: conexaoErp.id,
        erp: conexaoErp.erp,
        rotulo: conexaoErp.rotulo,
        status: conexaoErp.status,
        atualizadoEm: conexaoErp.atualizadoEm,
      })
      .from(conexaoErp)
      .where(eq(conexaoErp.clienteId, clienteId))
  })
}

/**
 * Cifra e grava a credencial de um ERP (upsert por cliente+erp — reconectar substitui).
 * NUNCA loga a credencial. Lança ChaveCriptografiaAusenteError se a chave não estiver configurada.
 */
export function salvarCredencialErp(
  clienteId: string,
  entrada: { erp: ErpTipo; rotulo: string; credenciais: Record<string, string> },
): Promise<ConexaoErpResumo> {
  const chave = obterChave()
  const { payloadCifrado, iv, authTag } = cifrarCredenciais(entrada.erp, entrada.credenciais, chave)

  return withTenant(clienteId, async (tx) => {
    const [row] = await tx
      .insert(conexaoErp)
      .values({
        clienteId,
        erp: entrada.erp,
        rotulo: entrada.rotulo,
        status: 'conectado',
        payloadCifrado,
        iv,
        authTag,
      })
      .onConflictDoUpdate({
        target: [conexaoErp.clienteId, conexaoErp.erp],
        set: { rotulo: entrada.rotulo, status: 'conectado', payloadCifrado, iv, authTag, atualizadoEm: new Date() },
      })
      .returning({
        id: conexaoErp.id,
        erp: conexaoErp.erp,
        rotulo: conexaoErp.rotulo,
        status: conexaoErp.status,
        atualizadoEm: conexaoErp.atualizadoEm,
      })
    return row
  })
}

/**
 * Decifra a credencial de uma conexão. USO EXCLUSIVO DO SERVIDOR (adapters de ERP, F8) —
 * nunca deve ser exposto por uma rota que devolva o resultado ao client.
 */
export function obterCredencialErp(
  clienteId: string,
  conexaoId: string,
): Promise<Record<string, string> | null> {
  const chave = obterChave()
  return withTenant(clienteId, async (tx) => {
    const [row] = await tx
      .select()
      .from(conexaoErp)
      .where(and(eq(conexaoErp.id, conexaoId), eq(conexaoErp.clienteId, clienteId)))
    if (!row) return null
    const plano = decifrar(row.payloadCifrado, row.iv, row.authTag, chave)
    return JSON.parse(plano) as Record<string, string>
  })
}

/** Remove (desconecta) uma conexão de ERP do tenant. */
export function removerConexaoErp(clienteId: string, conexaoId: string): Promise<void> {
  return withTenant(clienteId, async (tx) => {
    await tx
      .delete(conexaoErp)
      .where(and(eq(conexaoErp.id, conexaoId), eq(conexaoErp.clienteId, clienteId)))
  })
}
