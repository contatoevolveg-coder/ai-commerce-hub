import { env } from '../env'
import { ErpAdapterError } from '../contracts/erp'

/**
 * Handshake OAuth2 do Bling (API v3), fase F8. As credenciais do APP (client_id/secret) vêm do
 * ambiente sandbox (BLING_CLIENT_ID/BLING_CLIENT_SECRET). Este módulo NÃO persiste nada e NUNCA
 * loga token/segredo — quem chama (rota de callback) persiste via oauth-token.service.
 */

const BLING_BASE = 'https://www.bling.com.br/Api/v3'

/** Constrói a URL de autorização para redirecionar o lojista ao consentimento do Bling. */
export function gerarUrlAutorizacaoBling(state: string): string {
  if (!env.BLING_CLIENT_ID) {
    throw new ErpAdapterError('UNAUTHORIZED', 'BLING_CLIENT_ID não configurado no ambiente.')
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.BLING_CLIENT_ID,
    state,
  })
  if (env.BLING_REDIRECT_URI) params.set('redirect_uri', env.BLING_REDIRECT_URI)
  return `${BLING_BASE}/oauth/authorize?${params.toString()}`
}

export interface TokensBling {
  accessToken: string
  refreshToken: string
  expiraEm: Date
}

/** Troca o authorization_code (recebido no callback) por access/refresh token. */
export async function trocarCodePorTokenBling(code: string): Promise<TokensBling> {
  const { BLING_CLIENT_ID, BLING_CLIENT_SECRET, BLING_REDIRECT_URI } = env
  if (!BLING_CLIENT_ID || !BLING_CLIENT_SECRET) {
    throw new ErpAdapterError(
      'UNAUTHORIZED',
      'Credenciais do app Bling ausentes (BLING_CLIENT_ID/BLING_CLIENT_SECRET).',
    )
  }

  const authHeader = Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({ grant_type: 'authorization_code', code })
  if (BLING_REDIRECT_URI) body.set('redirect_uri', BLING_REDIRECT_URI)

  const resp = await fetch(`${BLING_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authHeader}`,
    },
    body: body.toString(),
  })

  if (!resp.ok) {
    // NUNCA logar corpo/segredos — só o status.
    throw new ErpAdapterError(
      'UNAUTHORIZED',
      `Falha no handshake OAuth do Bling. Status: ${resp.status}`,
    )
  }

  const data = await resp.json()
  if (!data.access_token || !data.refresh_token) {
    throw new ErpAdapterError('UNAUTHORIZED', 'Resposta OAuth do Bling sem tokens esperados.')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiraEm: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  }
}
