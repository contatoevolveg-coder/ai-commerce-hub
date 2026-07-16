import type { Order } from "../types"
import { listarPedidos, resumoPedidos } from "@ai-commerce/core/src/services/pedidos.service"
import { getClienteIdAtual } from "../tenant"
import { formatBRL, formatData } from "../format"

const statusMap: Record<string, Order["status"]> = {
  novo: "processing",
  pago: "processing",
  enviado: "shipped",
  entregue: "delivered",
  cancelado: "cancelled",
}

export async function getOrders(): Promise<Order[]> {
  try {
    const rows = await listarPedidos(getClienteIdAtual())
    return rows.map((r): Order => ({
      id: r.numero,
      customer: r.cliente ?? "—",
      channel: r.canal ?? "—",
      amount: formatBRL(r.totalCentavos),
      status: statusMap[r.status] ?? "processing",
      date: formatData(r.criadoEm),
    }))
  } catch (e) {
    console.error("[orders] getOrders:", e instanceof Error ? e.message : e)
    return []
  }
}

export async function getOrdersSummary(): Promise<{
  total: number
  pending: number
  shipped: number
  cancelled: number
}> {
  try {
    return await resumoPedidos(getClienteIdAtual())
  } catch (e) {
    console.error("[orders] getOrdersSummary:", e instanceof Error ? e.message : e)
    return { total: 0, pending: 0, shipped: 0, cancelled: 0 }
  }
}
