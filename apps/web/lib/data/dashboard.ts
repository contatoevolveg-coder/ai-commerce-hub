import type { Kpi } from "../types"

export async function getDashboardKpis(): Promise<Kpi[]> {
  // TODO: Supabase
  return [
    { label: "Receita", value: "R$ 0,00" },
    { label: "Pedidos", value: "0" },
    { label: "Conversão", value: "0%" },
    { label: "Agentes IA", value: "0" },
  ]
}

export async function getSalesData(): Promise<{
  labels: string[]
  data: number[]
}> {
  // TODO: Supabase
  return { labels: [], data: [] }
}
