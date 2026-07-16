import type { AnalyticsData, ChartPoint } from "../types"
import { getAnalytics as getAnalyticsRaw } from "@ai-commerce/core/src/services/analytics.service"
import { getClienteIdAtual } from "../tenant"
import { formatBRL, reaisNumber, labelDiaMes } from "../format"

function parseDias(period: string): number {
  const n = parseInt(period, 10)
  return Number.isFinite(n) && n > 0 ? n : 14
}

export async function getAnalytics(period: string): Promise<AnalyticsData> {
  const dias = parseDias(period)
  try {
    const raw = await getAnalyticsRaw(getClienteIdAtual(), dias)

    // Receita diária — buckets zerados na ordem cronológica.
    const buckets = new Map<string, bigint>()
    for (let i = dias - 1; i >= 0; i--) {
      buckets.set(labelDiaMes(new Date(Date.now() - i * 86_400_000)), 0n)
    }
    for (const p of raw.pedidos) {
      const key = labelDiaMes(p.criadoEm)
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0n) + p.total)
    }
    const revenue = [...buckets.values()].map(reaisNumber)

    // Pedidos por canal.
    const porCanal = new Map<string, number>()
    for (const p of raw.pedidos) {
      const canal = p.canalNome ?? "—"
      porCanal.set(canal, (porCanal.get(canal) ?? 0) + 1)
    }
    const ordersByChannel: ChartPoint[] = [...porCanal.entries()].map(([label, value]) => ({
      label,
      value,
    }))

    // Top produtos por receita.
    const porProduto = new Map<string, bigint>()
    for (const it of raw.itens) {
      const nome = it.produtoNome ?? "—"
      porProduto.set(nome, (porProduto.get(nome) ?? 0n) + it.precoUnitario * BigInt(it.quantidade))
    }
    const topProducts = [...porProduto.entries()]
      .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
      .slice(0, 5)
      .map(([name, centavos]) => ({ name, value: formatBRL(centavos) }))

    // Conversão: sem fonte de tráfego/visitas ainda (viria de um agente de analytics
    // externo). Retorna vazio de propósito — a tela mostra o estado "sem dados" honesto,
    // em vez de inventar um número (AGENTS.md: não inventar métrica de negócio).
    return { revenue, ordersByChannel, conversion: [], topProducts }
  } catch (e) {
    console.error("[analytics] getAnalytics:", e instanceof Error ? e.message : e)
    return { revenue: [], ordersByChannel: [], conversion: [], topProducts: [] }
  }
}
