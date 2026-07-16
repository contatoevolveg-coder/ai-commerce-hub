import { MarketplaceAdapter, MarketplaceAnuncio, MarketplaceAdapterError } from '../contracts/marketplace'
import { env } from '../env'

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
    throw new MarketplaceAdapterError('NETWORK_ERROR', 'Simulated network failure')
  }
  
  return operation()
}

export class MercadoLivreMockAdapter implements MarketplaceAdapter {
  async listarAnuncios(_clienteId: string): Promise<MarketplaceAnuncio[]> {
    return withLatency(() => {
      return [
        { idRemoto: 'MLB12345', sku: 'SKU-001', precoCentavos: 15000, status: 'ativo' },
        { idRemoto: 'MLB12346', sku: 'SKU-002', precoCentavos: 25000, status: 'ativo' },
      ]
    })
  }

  async atualizarPreco(_clienteId: string, _idRemoto: string, _precoCentavos: number): Promise<void> {
    return withLatency(() => {
      // Simulate success
    })
  }

  async atualizarEstoque(_clienteId: string, _idRemoto: string, _quantidade: number): Promise<void> {
    return withLatency(() => {
      // Simulate success
    })
  }
}
