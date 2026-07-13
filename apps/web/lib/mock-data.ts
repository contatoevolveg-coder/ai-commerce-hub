export interface KpiChange {
  value: number
  trend: "up" | "down"
}

export interface Kpi {
  value: string
  change: KpiChange
}

export const kpis: Record<string, Kpi> = {
  revenue: { value: "R$ 47.280", change: { value: 12.5, trend: "up" } },
  orders: { value: "384", change: { value: 8.2, trend: "up" } },
  conversion: { value: "3.2%", change: { value: 0.4, trend: "down" } },
  aiAgents: { value: "5 ativos", change: { value: 2, trend: "up" } },
}

export const salesChart = {
  labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  data: [4200, 5800, 4900, 7200, 6800, 8900, 9400],
}

export interface Order {
  id: string
  customer: string
  amount: string
  status: "delivered" | "processing" | "shipped" | "cancelled"
  date: string
}

export const recentOrders: Order[] = [
  { id: "#4021", customer: "Maria Silva", amount: "R$ 289,90", status: "delivered", date: "Hoje, 14:32" },
  { id: "#4020", customer: "Carlos Souza", amount: "R$ 1.450,00", status: "processing", date: "Hoje, 11:15" },
  { id: "#4019", customer: "Ana Oliveira", amount: "R$ 89,90", status: "shipped", date: "Ontem, 19:47" },
  { id: "#4018", customer: "Pedro Santos", amount: "R$ 3.200,00", status: "delivered", date: "Ontem, 16:20" },
  { id: "#4017", customer: "Juliana Costa", amount: "R$ 560,00", status: "cancelled", date: "Ontem, 09:05" },
]

export interface AiAgent {
  name: string
  type: string
  status: "active" | "paused" | "error"
  actions24h: number
}

export const aiAgents: AiAgent[] = [
  { name: "Atendente Virtual", type: "Atendimento", status: "active", actions24h: 142 },
  { name: "Precificador", type: "Pricing", status: "active", actions24h: 89 },
  { name: "Gestor de Estoque", type: "Estoque", status: "active", actions24h: 34 },
  { name: "Recomendador", type: "Recomendação", status: "paused", actions24h: 0 },
  { name: "Analista de Fraude", type: "Segurança", status: "active", actions24h: 17 },
]
