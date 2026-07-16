import { ErpAdapter, ErpProduto, ErpEstoque, ErpPedido, ErpAdapterError } from '../contracts/erp'
import { env } from '../env'

// Simple LCG PRNG for deterministic mock data
class PRNG {
  private seed: number
  constructor(seed: number) {
    this.seed = seed
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}

const prng = new PRNG(42)

async function withLatency<T>(operation: () => T): Promise<T> {
  const ms = 100 + Math.floor(prng.next() * 300)
  await new Promise(resolve => setTimeout(resolve, ms))
  
  if (prng.next() < env.ERROR_RATE) {
    throw new ErpAdapterError('NETWORK_ERROR', 'Simulated network failure')
  }
  
  return operation()
}

export class BlingMockAdapter implements ErpAdapter {
  async listarProdutos(_clienteId: string): Promise<ErpProduto[]> {
    return withLatency(() => {
      return [
        { idRemoto: 'bling-prod-1', sku: 'SKU-001', nome: 'Produto Mock 1', precoCentavos: 15000 },
        { idRemoto: 'bling-prod-2', sku: 'SKU-002', nome: 'Produto Mock 2', precoCentavos: 25000 },
        { idRemoto: 'bling-prod-3', sku: 'SKU-003', nome: 'Produto Mock 3', precoCentavos: 5000 },
      ]
    })
  }

  async obterEstoque(_clienteId: string, produtoIds: string[]): Promise<ErpEstoque[]> {
    return withLatency(() => {
      return produtoIds.map(id => ({
        idRemoto: id,
        quantidade: Math.floor(prng.next() * 100)
      }))
    })
  }

  async listarPedidos(_clienteId: string, desde: Date): Promise<ErpPedido[]> {
    return withLatency(() => {
      return [
        {
          idRemoto: 'bling-ped-1',
          compradorNome: 'João Silva',
          totalCentavos: 15000,
          itens: [
            { idRemotoProduto: 'bling-prod-1', quantidade: 1, precoUnitarioCentavos: 15000 }
          ],
          dataCriacao: new Date(desde.getTime() + 10000).toISOString()
        }
      ]
    })
  }
}
