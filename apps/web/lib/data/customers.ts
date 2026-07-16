import type { Customer } from "../types"
import { listarCompradores, resumoCompradores } from "@ai-commerce/core/src/services/clientes.service"
import { getClienteIdAtual } from "../tenant"
import { formatBRL, formatData } from "../format"

export async function getCustomers(): Promise<Customer[]> {
  try {
    const rows = await listarCompradores(getClienteIdAtual())
    return rows.map((r): Customer => ({
      id: r.id,
      name: r.nome,
      email: r.email ?? "—",
      orders: r.pedidosCount,
      totalSpent: formatBRL(r.totalGastoCentavos),
      since: formatData(r.desde),
    }))
  } catch (e) {
    console.error("[customers] getCustomers:", e instanceof Error ? e.message : e)
    return []
  }
}

export async function getCustomersSummary(): Promise<{
  total: number
  new30d: number
  avgTicket: string
}> {
  try {
    const r = await resumoCompradores(getClienteIdAtual())
    return { total: r.total, new30d: r.new30d, avgTicket: formatBRL(r.ticketMedioCentavos) }
  } catch (e) {
    console.error("[customers] getCustomersSummary:", e instanceof Error ? e.message : e)
    return { total: 0, new30d: 0, avgTicket: "R$ 0,00" }
  }
}
