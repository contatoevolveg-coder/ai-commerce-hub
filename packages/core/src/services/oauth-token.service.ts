import { and, eq } from 'drizzle-orm'
import { withTenant, tokenOauth } from '@ai-commerce/db'
import { cifrar, decifrar } from '../crypto/credencial'
import { obterChave } from '../crypto/chave'

/**
 * Serviço de tokens OAuth2 (F8 — Bling real). Persiste os tokens de sessão VOLÁTEIS
 * (access/refresh) na tabela dedicada `token_oauth`, cifrados com AES-256-GCM. Separado do
 * cofre de credenciais estáticas (`integracoes.service` / `conexao_erp`) de propósito: tokens
 * rotacionam a cada refresh, credenciais de autorização não. USO EXCLUSIVO DO SERVIDOR
 * (adapters de ERP) — nunca exposto por rota que devolva o resultado ao client. NUNCA loga token.
 */

export interface TokensOAuth {
  accessToken: string
  refreshToken: string
  /** Instante de expiração do access token (não é segredo — guardado em claro). */
  expiraEm: Date
}

/** Cifra e grava (upsert por conexão) os tokens OAuth de uma conexão de ERP. */
export function salvarTokenOAuth(
  clienteId: string,
  conexaoErpId: string,
  tokens: TokensOAuth,
): Promise<void> {
  const chave = obterChave()
  const { payloadCifrado, iv, authTag } = cifrar(
    JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
    chave,
  )

  return withTenant(clienteId, async (tx) => {
    await tx
      .insert(tokenOauth)
      .values({
        clienteId,
        conexaoErpId,
        payloadCifrado,
        iv,
        authTag,
        expiraEm: tokens.expiraEm,
      })
      .onConflictDoUpdate({
        target: [tokenOauth.conexaoErpId],
        set: { payloadCifrado, iv, authTag, expiraEm: tokens.expiraEm, atualizadoEm: new Date() },
      })
  })
}

/** Decifra e retorna os tokens OAuth de uma conexão de ERP, ou null se ainda não houver. */
export function obterTokenOAuth(
  clienteId: string,
  conexaoErpId: string,
): Promise<TokensOAuth | null> {
  const chave = obterChave()
  return withTenant(clienteId, async (tx) => {
    const [row] = await tx
      .select()
      .from(tokenOauth)
      .where(and(eq(tokenOauth.conexaoErpId, conexaoErpId), eq(tokenOauth.clienteId, clienteId)))
    if (!row) return null

    const plano = JSON.parse(decifrar(row.payloadCifrado, row.iv, row.authTag, chave)) as {
      accessToken: string
      refreshToken: string
    }
    return {
      accessToken: plano.accessToken,
      refreshToken: plano.refreshToken,
      expiraEm: row.expiraEm,
    }
  })
}
