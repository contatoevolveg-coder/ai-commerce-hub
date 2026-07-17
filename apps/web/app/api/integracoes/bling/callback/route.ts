import { NextResponse, type NextRequest } from 'next/server'
import {
  atualizarStatusConexaoErp,
} from '@ai-commerce/core/src/services/integracoes.service'
import { salvarTokenOAuth } from '@ai-commerce/core/src/services/oauth-token.service'
import { trocarCodePorTokenBling } from '@ai-commerce/integrations/src/real/bling.oauth'
import { getClienteIdAtual } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * Callback do OAuth do Bling: valida o `state` (nonce vs cookie), troca o `code` por tokens,
 * persiste cifrado na tabela token_oauth e marca a conexão como conectada. Redireciona de volta
 * para /config com o resultado. NUNCA loga token/segredo.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const origin = url.origin
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const nonceCookie = req.cookies.get('bling_oauth_nonce')?.value

  const falha = (motivo: string) =>
    NextResponse.redirect(`${origin}/config?bling=erro&motivo=${encodeURIComponent(motivo)}`)

  if (!code || !state) return falha('parametros ausentes')

  let parsed: { c?: string; n?: string }
  try {
    parsed = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return falha('state invalido')
  }

  // CSRF: o nonce do state precisa bater com o cookie httpOnly gravado no authorize.
  if (!parsed.n || !nonceCookie || parsed.n !== nonceCookie || !parsed.c) {
    return falha('state nao confere')
  }

  const clienteId = getClienteIdAtual()
  const conexaoId = parsed.c

  try {
    const tokens = await trocarCodePorTokenBling(code)
    await salvarTokenOAuth(clienteId, conexaoId, tokens)
    await atualizarStatusConexaoErp(clienteId, conexaoId, 'conectado')

    const res = NextResponse.redirect(`${origin}/config?bling=ok`)
    res.cookies.delete('bling_oauth_nonce')
    return res
  } catch (e) {
    await atualizarStatusConexaoErp(clienteId, conexaoId, 'erro').catch(() => undefined)
    const msg = e instanceof Error ? e.message : 'falha no handshake'
    return falha(msg)
  }
}
