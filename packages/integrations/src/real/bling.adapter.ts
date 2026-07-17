import {
  ErpAdapter,
  ErpProduto,
  ErpEstoque,
  ErpPedido,
  ErpAdapterError,
} from '../contracts/erp'
import {
  listarConexoesErp,
  obterCredencialErp,
  salvarTokenOAuth,
  obterTokenOAuth,
  type ConexaoErpResumo,
} from '@ai-commerce/core'
import { env } from '../env'

/**
 * Contexto de uma conexão Bling de um tenant: o id da conexão (para associar os tokens),
 * as credenciais estáticas de autorização vindas do cofre (`conexao_erp`) e as credenciais
 * de APP (client_id/secret) que, por decisão do projeto (F8), vêm do ambiente sandbox.
 */
interface BlingContexto {
  conexaoId: string
  clientId: string
  clientSecret: string
  /** Código de autorização OAuth (single-use), presente só no primeiro handshake. */
  code?: string
}

export class BlingRealAdapter implements ErpAdapter {
  private readonly baseUrl = 'https://www.bling.com.br/Api/v3'

  private async getContexto(clienteId: string): Promise<BlingContexto> {
    const conexoes = await listarConexoesErp(clienteId)
    const conexaoBling = conexoes.find((c: ConexaoErpResumo) => c.erp === 'bling')

    if (!conexaoBling) {
      throw new ErpAdapterError('UNAUTHORIZED', 'ERP Bling não está conectado para este cliente.')
    }

    const credenciais = await obterCredencialErp(clienteId, conexaoBling.id)

    // client_id/secret vêm do APP Bling (env sandbox), com fallback para o que o tenant
    // gravou no cofre. Sem eles não há como fazer o handshake OAuth.
    const clientId = env.BLING_CLIENT_ID || credenciais?.clientId
    const clientSecret = env.BLING_CLIENT_SECRET || credenciais?.clientSecret
    if (!clientId || !clientSecret) {
      throw new ErpAdapterError(
        'UNAUTHORIZED',
        'Credenciais OAuth do app Bling ausentes (BLING_CLIENT_ID/BLING_CLIENT_SECRET).',
      )
    }

    return {
      conexaoId: conexaoBling.id,
      clientId,
      clientSecret,
      code: credenciais?.code,
    }
  }

  private async trocarToken(
    clienteId: string,
    ctx: BlingContexto,
    refreshToken?: string,
  ): Promise<string> {
    const authHeader = Buffer.from(`${ctx.clientId}:${ctx.clientSecret}`).toString('base64')

    const body = new URLSearchParams()
    if (refreshToken) {
      body.append('grant_type', 'refresh_token')
      body.append('refresh_token', refreshToken)
    } else if (ctx.code) {
      body.append('grant_type', 'authorization_code')
      body.append('code', ctx.code)
      if (env.BLING_REDIRECT_URI) body.append('redirect_uri', env.BLING_REDIRECT_URI)
    } else {
      throw new ErpAdapterError(
        'UNAUTHORIZED',
        'Sem refresh token nem código de autorização — refaça o handshake OAuth do Bling.',
      )
    }

    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: body.toString(),
    })

    if (!response.ok) {
      // NUNCA logar tokens/segredos — só o status genérico.
      throw new ErpAdapterError(
        'UNAUTHORIZED',
        `Falha ao obter token OAuth do Bling. Status: ${response.status}`,
      )
    }

    const data = await response.json()
    const accessToken: string = data.access_token
    const newRefreshToken: string = data.refresh_token
    const expiresIn: number = data.expires_in

    if (!accessToken || !newRefreshToken) {
      throw new ErpAdapterError('UNAUTHORIZED', 'Resposta OAuth do Bling sem tokens esperados.')
    }

    // Persiste os tokens na tabela DEDICADA e cifrada (token_oauth) — nunca no cofre de
    // credenciais estáticas, e nunca em log.
    await salvarTokenOAuth(clienteId, ctx.conexaoId, {
      accessToken,
      refreshToken: newRefreshToken,
      expiraEm: new Date(Date.now() + expiresIn * 1000),
    })

    return accessToken
  }

  private async getAccessToken(clienteId: string): Promise<string> {
    const ctx = await this.getContexto(clienteId)
    const stored = await obterTokenOAuth(clienteId, ctx.conexaoId)

    // Reusa o access token se ainda faltarem >60s para expirar.
    if (stored && stored.expiraEm.getTime() > Date.now() + 60_000) {
      return stored.accessToken
    }

    return this.trocarToken(clienteId, ctx, stored?.refreshToken)
  }

  private async fetchApi(clienteId: string, endpoint: string, options: RequestInit = {}) {
    let token = await this.getAccessToken(clienteId)

    const makeRequest = async (accessToken: string) => {
      const url = `${this.baseUrl}${endpoint}`
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }
      return fetch(url, { ...options, headers })
    }

    let response = await makeRequest(token)

    if (response.status === 401) {
      // Token pode ter expirado exatamente agora — força um refresh e tenta uma vez mais.
      const ctx = await this.getContexto(clienteId)
      const stored = await obterTokenOAuth(clienteId, ctx.conexaoId)
      token = await this.trocarToken(clienteId, ctx, stored?.refreshToken)
      response = await makeRequest(token)
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new ErpAdapterError('RATE_LIMIT', 'Limite de requisições excedido no Bling.')
      }
      if (response.status === 404) {
        throw new ErpAdapterError('NOT_FOUND', 'Recurso não encontrado no Bling.')
      }
      throw new ErpAdapterError('NETWORK_ERROR', `Erro da API Bling: ${response.status}`)
    }

    // if response body is empty, return null
    const text = await response.text()
    if (!text) return null
    return JSON.parse(text)
  }

  async listarProdutos(clienteId: string): Promise<ErpProduto[]> {
    const data = await this.fetchApi(clienteId, '/produtos')
    if (!data || !data.data) return []

    return data.data.map((item: Record<string, unknown>) => ({
      idRemoto: String(item.id),
      sku: String(item.codigo),
      nome: String(item.nome),
      precoCentavos: Math.round(parseFloat(String(item.preco)) * 100),
    }))
  }

  async obterEstoque(clienteId: string, produtoIds: string[]): Promise<ErpEstoque[]> {
    if (produtoIds.length === 0) return []
    
    const query = new URLSearchParams()
    produtoIds.forEach(id => query.append('idsProdutos[]', id))
    
    const data = await this.fetchApi(clienteId, `/estoques/saldos?${query.toString()}`)
    if (!data || !data.data) return []

    return data.data.map((item: Record<string, unknown>) => {
      const produto = item.produto as Record<string, unknown>
      return {
        idRemoto: String(produto.id),
        quantidade: Number(item.saldoFisicoTotal),
      }
    })
  }

  async listarPedidos(clienteId: string, desde: Date): Promise<ErpPedido[]> {
    const dataStr = desde.toISOString().split('T')[0]
    const data = await this.fetchApi(clienteId, `/pedidos/vendas?dataInicial=${dataStr}`)
    if (!data || !data.data) return []

    return data.data.map((item: Record<string, unknown>) => {
      const contato = (item.contato || {}) as Record<string, unknown>
      const itens = (item.itens || []) as Array<Record<string, unknown>>
      
      return {
        idRemoto: String(item.id),
        compradorNome: String(contato.nome || 'Desconhecido'),
        compradorDocumento: contato.numeroDocumento ? String(contato.numeroDocumento) : undefined,
        totalCentavos: Math.round(parseFloat(String(item.total)) * 100),
        itens: itens.map((i: Record<string, unknown>) => {
          const prod = (i.produto || {}) as Record<string, unknown>
          return {
            idRemotoProduto: prod.id ? String(prod.id) : '',
            quantidade: parseFloat(String(i.quantidade)),
            precoUnitarioCentavos: Math.round(parseFloat(String(i.valorUnitario)) * 100),
          }
        }),
        dataCriacao: String(item.data),
      }
    })
  }

  async atualizarPreco(clienteId: string, sku: string, precoCentavos: number): Promise<void> {
    console.log(`[BlingRealAdapter] Iniciando escrita controlada: Preço SKU ${sku} para ${precoCentavos} cents (Cliente ${clienteId})`)
    
    // Primeiro encontra o produto para pegar o ID numérico
    const produtosResponse = await this.fetchApi(clienteId, `/produtos?codigo=${sku}`)
    if (!produtosResponse || !produtosResponse.data || produtosResponse.data.length === 0) {
      throw new ErpAdapterError('NOT_FOUND', `Produto com SKU ${sku} não encontrado.`)
    }
    const produtoId = produtosResponse.data[0].id

    // PUT /produtos/{id}
    const precoFloat = precoCentavos / 100
    await this.fetchApi(clienteId, `/produtos/${produtoId}`, {
      method: 'PUT',
      body: JSON.stringify({ preco: precoFloat }),
    })
    
    console.log(`[BlingRealAdapter] Concluída escrita controlada: Preço SKU ${sku}`)
  }

  async atualizarEstoque(clienteId: string, sku: string, quantidade: number): Promise<void> {
    console.log(`[BlingRealAdapter] Iniciando escrita controlada: Estoque SKU ${sku} para ${quantidade} (Cliente ${clienteId})`)
    
    const produtosResponse = await this.fetchApi(clienteId, `/produtos?codigo=${sku}`)
    if (!produtosResponse || !produtosResponse.data || produtosResponse.data.length === 0) {
      throw new ErpAdapterError('NOT_FOUND', `Produto com SKU ${sku} não encontrado.`)
    }
    const produtoId = produtosResponse.data[0].id

    // Na API v3 para saldo, criamos um registro em /estoques
    await this.fetchApi(clienteId, `/estoques`, {
      method: 'POST',
      body: JSON.stringify({
        produto: { id: produtoId },
        operacao: 'B', // Balanço (define o saldo exato)
        quantidade: quantidade,
        observacoes: 'Atualizado via AI Commerce Hub'
      }),
    })
    
    console.log(`[BlingRealAdapter] Concluída escrita controlada: Estoque SKU ${sku}`)
  }
}
