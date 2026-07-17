import { and, eq } from 'drizzle-orm'
import { withTenant, conexaoErp, auditLog } from '@ai-commerce/db'
import { cifrar, decifrar } from '../crypto/credencial'
import { obterChave, ChaveCriptografiaAusenteError } from '../crypto/chave'
import { getErpCatalogo, type ErpTipo } from '../integracoes/catalogo-erp'
import { ValidationError } from '../errors'

// Reexport para consumidores que já importavam o erro daqui (ex. apps/web/lib/api-handler.ts).
export { ChaveCriptografiaAusenteError }

/**
 * Valida que as credenciais têm exatamente os campos exigidos pelo ERP (nenhum obrigatório
 * vazio) e retorna a versão limpa (trim). Função pura.
 */
export function validarCredenciais(
  erp: ErpTipo,
  credenciais: Record<string, string>,
): Record<string, string> {
  const catalogo = getErpCatalogo(erp)
  if (!catalogo) throw new ValidationError(`ERP não suportado: ${erp}`)

  const limpo: Record<string, string> = {}
  for (const campo of catalogo.campos) {
    const valor = credenciais[campo.chave]
    const isEmpty = typeof valor !== 'string' || valor.trim() === ''
    
    if (isEmpty && !campo.opcional) {
      throw new ValidationError(`Campo obrigatório ausente para ${catalogo.nome}: ${campo.rotulo}.`)
    }
    
    if (!isEmpty) {
      limpo[campo.chave] = valor.trim()
    }
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
  atorId: string = 'sistema',
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

    await tx.insert(auditLog).values({
      clienteId,
      ator: atorId,
      acao: 'salvar_conexao_erp',
      entidade: 'conexao_erp',
      entidadeId: row.id,
      valorNovo: { erp: row.erp, rotulo: row.rotulo },
      motivo: 'Credencial ERP configurada/atualizada',
    })

    return row
  })
}

/**
 * Garante que existe uma conexão de ERP para o tenant (cria se não houver) e devolve seu id.
 * Usada pelo fluxo OAuth (F8): o client_id/secret vêm do ambiente, então a conexão nasce só
 * como "recipiente" dos tokens (payload cifrado vazio) até o handshake concluir. Se a conexão
 * já existir (ex. criada pelo cofre com credenciais), NÃO sobrescreve o payload — só garante a
 * linha e atualiza o rótulo.
 */
export function garantirConexaoErpOAuth(
  clienteId: string,
  erp: ErpTipo,
  rotulo: string,
): Promise<string> {
  const chave = obterChave()
  const vazio = cifrar(JSON.stringify({}), chave)
  return withTenant(clienteId, async (tx) => {
    const [row] = await tx
      .insert(conexaoErp)
      .values({
        clienteId,
        erp,
        rotulo,
        status: 'desconectado',
        payloadCifrado: vazio.payloadCifrado,
        iv: vazio.iv,
        authTag: vazio.authTag,
      })
      .onConflictDoUpdate({
        // Conexão já existe: preserva o payload atual, só atualiza o rótulo.
        target: [conexaoErp.clienteId, conexaoErp.erp],
        set: { rotulo, atualizadoEm: new Date() },
      })
      .returning({ id: conexaoErp.id })
    return row.id
  })
}

/** Atualiza o status de uma conexão de ERP (ex. 'conectado' após o handshake OAuth). */
export function atualizarStatusConexaoErp(
  clienteId: string,
  conexaoId: string,
  status: 'conectado' | 'desconectado' | 'erro',
): Promise<void> {
  return withTenant(clienteId, async (tx) => {
    await tx
      .update(conexaoErp)
      .set({ status, atualizadoEm: new Date() })
      .where(and(eq(conexaoErp.id, conexaoId), eq(conexaoErp.clienteId, clienteId)))
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
export function removerConexaoErp(clienteId: string, conexaoId: string, atorId: string = 'sistema'): Promise<void> {
  return withTenant(clienteId, async (tx) => {
    const [row] = await tx
      .select({ erp: conexaoErp.erp })
      .from(conexaoErp)
      .where(and(eq(conexaoErp.id, conexaoId), eq(conexaoErp.clienteId, clienteId)))

    if (row) {
      await tx
        .delete(conexaoErp)
        .where(and(eq(conexaoErp.id, conexaoId), eq(conexaoErp.clienteId, clienteId)))

      await tx.insert(auditLog).values({
        clienteId,
        ator: atorId,
        acao: 'remover_conexao_erp',
        entidade: 'conexao_erp',
        entidadeId: conexaoId,
        valorAnterior: { erp: row.erp },
        motivo: 'Conexão ERP removida manualmente',
      })
    }
  })
}
