import { z } from 'zod'

export const ErpProdutoSchema = z.object({
  idRemoto: z.string(),
  sku: z.string(),
  nome: z.string(),
  precoCentavos: z.number().int(),
})
export type ErpProduto = z.infer<typeof ErpProdutoSchema>

export const ErpEstoqueSchema = z.object({
  idRemoto: z.string(),
  quantidade: z.number().int(),
})
export type ErpEstoque = z.infer<typeof ErpEstoqueSchema>

export const ErpPedidoItemSchema = z.object({
  idRemotoProduto: z.string(),
  quantidade: z.number().int(),
  precoUnitarioCentavos: z.number().int(),
})
export type ErpPedidoItem = z.infer<typeof ErpPedidoItemSchema>

export const ErpPedidoSchema = z.object({
  idRemoto: z.string(),
  compradorNome: z.string(),
  compradorDocumento: z.string().optional(),
  totalCentavos: z.number().int(),
  itens: z.array(ErpPedidoItemSchema),
  dataCriacao: z.string(),
})
export type ErpPedido = z.infer<typeof ErpPedidoSchema>

export interface ErpAdapter {
  listarProdutos(clienteId: string): Promise<ErpProduto[]>
  obterEstoque(clienteId: string, produtoIds: string[]): Promise<ErpEstoque[]>
  listarPedidos(clienteId: string, desde: Date): Promise<ErpPedido[]>
  atualizarPreco(clienteId: string, sku: string, precoCentavos: number): Promise<void>
  atualizarEstoque(clienteId: string, sku: string, quantidade: number): Promise<void>
}

export type ErpAdapterErrorType = 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'RATE_LIMIT' | 'NOT_FOUND' | 'UNKNOWN'

export class ErpAdapterError extends Error {
  constructor(
    public type: ErpAdapterErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ErpAdapterError'
  }
}
