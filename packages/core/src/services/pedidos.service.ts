import { desc, eq } from 'drizzle-orm'
import { withTenant, pedido, comprador, canal } from '@ai-commerce/db'

export interface PedidoResumo {
  id: string
  numero: string
  cliente: string | null
  canal: string | null
  totalCentavos: bigint
  status: string
  criadoEm: Date
}

/** Lista pedidos do tenant, do mais recente para o mais antigo, com comprador e canal. */
export function listarPedidos(clienteId: string, limit: number = 50, offset: number = 0): Promise<PedidoResumo[]> {
  return withTenant(clienteId, async (tx) => {
    return await tx
      .select({
        id: pedido.id,
        numero: pedido.numeroPedidoRemoto,
        cliente: comprador.nome,
        canal: canal.nome,
        totalCentavos: pedido.totalCentavos,
        status: pedido.status,
        criadoEm: pedido.criadoEm,
      })
      .from(pedido)
      .leftJoin(comprador, eq(comprador.id, pedido.compradorId))
      .leftJoin(canal, eq(canal.id, pedido.canalId))
      .where(eq(pedido.clienteId, clienteId))
      .orderBy(desc(pedido.criadoEm))
      .limit(limit)
      .offset(offset)
  })
}

/** Contagens por situação para os cards de resumo da tela de Pedidos. */
export function resumoPedidos(clienteId: string) {
  return withTenant(clienteId, async (tx) => {
    const rows = await tx
      .select({ status: pedido.status })
      .from(pedido)
      .where(eq(pedido.clienteId, clienteId))

    let pending = 0
    let shipped = 0
    let cancelled = 0
    for (const r of rows) {
      if (r.status === 'novo' || r.status === 'pago') pending++
      else if (r.status === 'enviado') shipped++
      else if (r.status === 'cancelado') cancelled++
    }
    return { total: rows.length, pending, shipped, cancelled }
  })
}
