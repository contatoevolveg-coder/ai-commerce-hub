import { z } from 'zod'

export const MarketplaceAnuncioSchema = z.object({
  idRemoto: z.string(),
  sku: z.string(),
  precoCentavos: z.number().int(),
  status: z.enum(['ativo', 'pausado', 'finalizado']),
})
export type MarketplaceAnuncio = z.infer<typeof MarketplaceAnuncioSchema>

export interface MarketplaceAdapter {
  listarAnuncios(clienteId: string): Promise<MarketplaceAnuncio[]>
  atualizarPreco(clienteId: string, idRemoto: string, precoCentavos: number): Promise<void>
  atualizarEstoque(clienteId: string, idRemoto: string, quantidade: number): Promise<void>
}

export type MarketplaceAdapterErrorType = 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'RATE_LIMIT' | 'NOT_FOUND' | 'UNKNOWN'

export class MarketplaceAdapterError extends Error {
  constructor(
    public type: MarketplaceAdapterErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'MarketplaceAdapterError'
  }
}
