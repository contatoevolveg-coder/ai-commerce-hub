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
  salvarCredencialErp,
  type ConexaoErpResumo
} from '@ai-commerce/core'

interface BlingCredenciais {
  conexaoId: string
  rotulo: string
  clientId?: string
  clientSecret?: string
  code?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  [key: string]: string | undefined
}

export class BlingRealAdapter implements ErpAdapter {
  private readonly baseUrl = 'https://www.bling.com.br/Api/v3'

  private async getCredenciais(clienteId: string): Promise<BlingCredenciais> {
    const conexoes = await listarConexoesErp(clienteId)
    const conexaoBling = conexoes.find((c: ConexaoErpResumo) => c.erp === 'bling')

    if (!conexaoBling) {
      throw new ErpAdapterError(
        'UNAUTHORIZED',
        'ERP Bling não está conectado para este cliente.'
      )
    }

    const credenciais = await obterCredencialErp(clienteId, conexaoBling.id)
    if (!credenciais) {
      throw new ErpAdapterError('UNAUTHORIZED', 'Credenciais não encontradas.')
    }

    return {
      conexaoId: conexaoBling.id,
      rotulo: conexaoBling.rotulo,
      ...credenciais,
    } as BlingCredenciais
  }

  private async refreshToken(clienteId: string, creds: BlingCredenciais): Promise<string> {
    if (!creds.clientId || !creds.clientSecret) {
      throw new ErpAdapterError('UNAUTHORIZED', 'Credenciais OAuth ausentes.')
    }

    const authHeader = Buffer.from(
      `${creds.clientId}:${creds.clientSecret}`
    ).toString('base64')

    const body = new URLSearchParams()
    if (creds.refreshToken) {
      body.append('grant_type', 'refresh_token')
      body.append('refresh_token', creds.refreshToken)
    } else if (creds.code) {
      body.append('grant_type', 'authorization_code')
      body.append('code', creds.code)
    } else {
      throw new ErpAdapterError(
        'UNAUTHORIZED',
        'Nem refresh token nem código de autorização encontrados.'
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
      // Note: never log the tokens or secrets, just generic errors
      throw new ErpAdapterError(
        'UNAUTHORIZED',
        `Falha ao obter token OAuth do Bling. Status: ${response.status}`
      )
    }

    const data = await response.json()
    const newAccessToken = data.access_token
    const newRefreshToken = data.refresh_token
    const expiresIn = data.expires_in

    const expiresAt = Date.now() + expiresIn * 1000

    // Save back to DB
    const novasCredenciais = {
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: expiresAt.toString(),
    }

    await salvarCredencialErp(
      clienteId,
      {
        erp: 'bling',
        rotulo: creds.rotulo || 'Bling ERP',
        credenciais: novasCredenciais,
      },
      'sistema'
    )

    return newAccessToken
  }

  private async getAccessToken(clienteId: string): Promise<string> {
    const creds = await this.getCredenciais(clienteId)

    if (
      creds.accessToken &&
      creds.expiresAt &&
      parseInt(creds.expiresAt, 10) > Date.now() + 60000
    ) {
      return creds.accessToken
    }

    return this.refreshToken(clienteId, creds)
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
      // Token might have expired precisely now
      const creds = await this.getCredenciais(clienteId)
      token = await this.refreshToken(clienteId, creds)
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
