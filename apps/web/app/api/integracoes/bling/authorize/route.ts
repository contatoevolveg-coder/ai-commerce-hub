import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { garantirConexaoErpOAuth } from '@ai-commerce/core/src/services/integracoes.service'
import { gerarUrlAutorizacaoBling } from '@ai-commerce/integrations/src/real/bling.oauth'
import { getClienteIdAtual, getAtorPapelAtual } from '@/lib/tenant'

export const dynamic = 'force-dynamic'

/**
 * Início do handshake OAuth do Bling: garante a conexão do tenant, gera um `state` com nonce
 * (CSRF, guardado em cookie httpOnly) e redireciona o lojista para o consentimento do Bling.
 */
export async function GET(req: NextRequest) {
  if (getAtorPapelAtual() !== 'admin') {
    return NextResponse.json(
      { erro: 'Apenas administradores podem conectar integrações.' },
      { status: 403 },
    )
  }

  const clienteId = getClienteIdAtual()
  const origin = new URL(req.url).origin

  try {
    const conexaoId = await garantirConexaoErpOAuth(clienteId, 'bling', 'Bling ERP')
    const nonce = randomUUID()
    const state = Buffer.from(JSON.stringify({ c: conexaoId, n: nonce })).toString('base64url')

    const res = NextResponse.redirect(gerarUrlAutorizacaoBling(state))
    res.cookies.set('bling_oauth_nonce', nonce, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 600,
    })
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro ao iniciar autorização do Bling.'
    return NextResponse.redirect(`${origin}/config?bling=erro&motivo=${encodeURIComponent(msg)}`)
  }
}
