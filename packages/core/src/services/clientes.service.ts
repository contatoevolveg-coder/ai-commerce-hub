import { eq } from 'drizzle-orm'
import { withTenant, comprador, pedido } from '@ai-commerce/db'

/**
 * Compradores do tenant com nº de pedidos, total gasto (ignora cancelados) e data do
 * primeiro pedido (ou cadastro, se ainda não comprou).
 */
export function listarCompradores(clienteId: string) {
  return withTenant(clienteId, async (tx) => {
    const compradores = await tx
      .select({
        id: comprador.id,
        nome: comprador.nome,
        email: comprador.email,
        criadoEm: comprador.createdAt,
      })
      .from(comprador)
      .where(eq(comprador.clienteId, clienteId))

    const pedidos = await tx
      .select({
        compradorId: pedido.compradorId,
        total: pedido.totalCentavos,
        status: pedido.status,
        criadoEm: pedido.criadoEm,
      })
      .from(pedido)
      .where(eq(pedido.clienteId, clienteId))

    return compradores.map((c) => {
      const seus = pedidos.filter((p) => p.compradorId === c.id && p.status !== 'cancelado')
      const totalGastoCentavos = seus.reduce((acc, p) => acc + p.total, 0n)
      const desde = seus.length
        ? seus.reduce((min, p) => (p.criadoEm < min ? p.criadoEm : min), seus[0].criadoEm)
        : c.criadoEm
      return {
        id: c.id,
        nome: c.nome,
        email: c.email,
        pedidosCount: seus.length,
        totalGastoCentavos,
        desde,
      }
    })
  })
}

export type CompradorRow = Awaited<ReturnType<typeof listarCompradores>>[number]

/** Resumo da base: total, novos nos últimos 30 dias e ticket médio (ignora cancelados). */
export function resumoCompradores(clienteId: string) {
  return withTenant(clienteId, async (tx) => {
    const trintaDias = new Date(Date.now() - 30 * 86_400_000)

    const compradores = await tx
      .select({ id: comprador.id, criadoEm: comprador.createdAt })
      .from(comprador)
      .where(eq(comprador.clienteId, clienteId))

    const pedidos = await tx
      .select({ total: pedido.totalCentavos, status: pedido.status })
      .from(pedido)
      .where(eq(pedido.clienteId, clienteId))

    const validos = pedidos.filter((p) => p.status !== 'cancelado')
    const somaCentavos = validos.reduce((acc, p) => acc + p.total, 0n)
    const ticketMedioCentavos = validos.length ? somaCentavos / BigInt(validos.length) : 0n
    const new30d = compradores.filter((c) => c.criadoEm >= trintaDias).length

    return { total: compradores.length, new30d, ticketMedioCentavos }
  })
}
