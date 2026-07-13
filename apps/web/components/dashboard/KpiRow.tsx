import { StatCard } from "@ai-commerce/ui"
import { kpis } from "@/lib/mock-data"
import { DollarSign, ShoppingCart, Activity, Bot } from "lucide-react"

export function KpiRow() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="RECEITA"
        value={kpis.revenue.value}
        change={kpis.revenue.change}
        icon={<DollarSign className="h-5 w-5" />}
        accentColor="primary"
      />
      <StatCard
        title="PEDIDOS"
        value={kpis.orders.value}
        change={kpis.orders.change}
        icon={<ShoppingCart className="h-5 w-5" />}
      />
      <StatCard
        title="CONVERSÃO"
        value={kpis.conversion.value}
        change={kpis.conversion.change}
        icon={<Activity className="h-5 w-5" />}
      />
      <StatCard
        title="AGENTES IA"
        value={kpis.aiAgents.value}
        change={kpis.aiAgents.change}
        icon={<Bot className="h-5 w-5" />}
        accentColor="ai"
      />
    </div>
  )
}
