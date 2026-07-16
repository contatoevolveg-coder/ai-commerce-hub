import type { Kpi } from "../types"
import { getResumoDashboard, getSerieVendas } from "@ai-commerce/core/src/services/dashboard.service"
import { getClienteIdAtual } from "../tenant"
import { formatBRL, reaisNumber, labelDiaMes } from "../format"

export async function getDashboardKpis(): Promise<Kpi[]> {
  try {
    const r = await getResumoDashboard(getClienteIdAtual())
    const ticket = r.pedidosCount > 0 ? r.receitaCentavos / BigInt(r.pedidosCount) : 0n
    return [
      { label: "Receita (30d)", value: formatBRL(r.receitaCentavos) },
      { label: "Pedidos (30d)", value: String(r.pedidosCount) },
      { label: "Ticket médio", value: formatBRL(ticket) },
      { label: "Agentes IA ativos", value: String(r.agentesAtivos) },
    ]
  } catch (e) {
    console.error("[dashboard] getDashboardKpis:", e instanceof Error ? e.message : e)
    return [
      { label: "Receita (30d)", value: "—" },
      { label: "Pedidos (30d)", value: "—" },
      { label: "Ticket médio", value: "—" },
      { label: "Agentes IA ativos", value: "—" },
    ]
  }
}

export async function getSalesData(): Promise<{ labels: string[]; data: number[] }> {
  const dias = 14
  try {
    const rows = await getSerieVendas(getClienteIdAtual(), dias)
    // Inicializa os últimos `dias` dias zerados, na ordem, e soma a receita de cada dia.
    const buckets = new Map<string, bigint>()
    for (let i = dias - 1; i >= 0; i--) {
      buckets.set(labelDiaMes(new Date(Date.now() - i * 86_400_000)), 0n)
    }
    for (const p of rows) {
      const key = labelDiaMes(p.criadoEm)
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0n) + p.total)
    }
    return {
      labels: [...buckets.keys()],
      data: [...buckets.values()].map(reaisNumber),
    }
  } catch (e) {
    console.error("[dashboard] getSalesData:", e instanceof Error ? e.message : e)
    return { labels: [], data: [] }
  }
}
