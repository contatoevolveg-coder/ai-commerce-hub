export interface KpiChange {
  value: number
  trend: "up" | "down"
}

export interface Kpi {
  label: string
  value: string
  change?: KpiChange
}

export interface Order {
  id: string
  customer: string
  channel: string
  amount: string
  status: "delivered" | "processing" | "shipped" | "cancelled"
  date: string
}

export interface Product {
  id: string
  name: string
  sku: string
  price: string
  stock: number
  status: "in_stock" | "low_stock" | "out_of_stock"
}

export interface Customer {
  id: string
  name: string
  email: string
  orders: number
  totalSpent: string
  since: string
}

export interface AiAgent {
  id: string
  name: string
  type: string
  description: string
  status: "active" | "paused" | "error"
  actions24h: number
}

export interface AgentActivity {
  id: string
  agent: string
  action: string
  time: string
}

export interface ChartPoint {
  label: string
  value: number
}

export interface AnalyticsData {
  revenue: number[]
  ordersByChannel: ChartPoint[]
  conversion: number[]
  topProducts: { name: string; value: string }[]
}
