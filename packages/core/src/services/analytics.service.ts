import { and, eq, gte } from 'drizzle-orm'
import { withTenant, pedido, canal, itemPedido, produto } from '@ai-commerce/db'

/**
 * Dados brutos para a tela de Analytics dos últimos `dias` dias. A modelagem final
 * (buckets diários, agrupamentos, formatação) fica na camada de view em apps/web —
 * aqui só isolamos por tenant e trazemos o necessário, ignorando cancelados.
 */
export function getAnalytics(clienteId: string, dias = 14) {
  return withTenant(clienteId, async (tx) => {
    const desde = new Date(Date.now() - dias * 86_400_000)

    const pedidos = await tx
      .select({
        total: pedido.totalCentavos,
        status: pedido.status,
        criadoEm: pedido.criadoEm,
        canalNome: canal.nome,
      })
      .from(pedido)
      .leftJoin(canal, eq(canal.id, pedido.canalId))
      .where(and(eq(pedido.clienteId, clienteId), gte(pedido.criadoEm, desde)))

    const itens = await tx
      .select({
        produtoNome: produto.nome,
        quantidade: itemPedido.quantidade,
        precoUnitario: itemPedido.precoUnitarioCentavos,
      })
      .from(itemPedido)
      .leftJoin(produto, eq(produto.id, itemPedido.produtoId))
      .where(eq(itemPedido.clienteId, clienteId))

    return {
      pedidos: pedidos.filter((p) => p.status !== 'cancelado'),
      itens,
    }
  })
}

export type AnalyticsRaw = Awaited<ReturnType<typeof getAnalytics>>
