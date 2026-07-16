import { and, eq, gte } from 'drizzle-orm'
import { withTenant, pedido, agente } from '@ai-commerce/db'

const JANELA_MS = 30 * 86_400_000

/** Agregados dos últimos 30 dias para os KPIs do dashboard. Receita ignora cancelados. */
export function getResumoDashboard(clienteId: string) {
  return withTenant(clienteId, async (tx) => {
    const desde = new Date(Date.now() - JANELA_MS)

    const pedidos = await tx
      .select({ total: pedido.totalCentavos, status: pedido.status })
      .from(pedido)
      .where(and(eq(pedido.clienteId, clienteId), gte(pedido.criadoEm, desde)))

    const agentesAtivos = await tx
      .select({ id: agente.id })
      .from(agente)
      .where(and(eq(agente.clienteId, clienteId), eq(agente.ativo, true)))

    const receitaCentavos = pedidos
      .filter((p) => p.status !== 'cancelado')
      .reduce((acc, p) => acc + p.total, 0n)

    return {
      receitaCentavos,
      pedidosCount: pedidos.length,
      agentesAtivos: agentesAtivos.length,
    }
  })
}

/** Pedidos não-cancelados dos últimos `dias` dias, para a série temporal de vendas. */
export function getSerieVendas(clienteId: string, dias = 14) {
  return withTenant(clienteId, async (tx) => {
    const desde = new Date(Date.now() - dias * 86_400_000)
    const rows = await tx
      .select({ total: pedido.totalCentavos, status: pedido.status, criadoEm: pedido.criadoEm })
      .from(pedido)
      .where(and(eq(pedido.clienteId, clienteId), gte(pedido.criadoEm, desde)))
    return rows.filter((p) => p.status !== 'cancelado')
  })
}

export type VendaRow = Awaited<ReturnType<typeof getSerieVendas>>[number]
