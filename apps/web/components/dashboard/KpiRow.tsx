import type { ReactNode } from "react"
import { StatCard } from "@ai-commerce/ui"
import type { Kpi } from "@/lib/types"
import { DollarSign, ShoppingCart, Activity, Bot } from "lucide-react"

const icons: Record<string, ReactNode> = {
  "Receita": <DollarSign className="h-5 w-5" />,
  "Pedidos": <ShoppingCart className="h-5 w-5" />,
  "Conversão": <Activity className="h-5 w-5" />,
  "Agentes IA": <Bot className="h-5 w-5" />,
}

const accents: Record<string, "primary" | "ai" | "success" | "warning"> = {
  "Receita": "primary",
  "Agentes IA": "ai",
}

export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <StatCard
          key={kpi.label}
          title={kpi.label}
          value={kpi.value}
          change={kpi.change}
          icon={icons[kpi.label]}
          accentColor={accents[kpi.label]}
        />
      ))}
    </div>
  )
}
