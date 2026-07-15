import { Shell } from "@/components/Shell"
import { PageHeader } from "@ai-commerce/ui"
import { KpiRow } from "@/components/dashboard/KpiRow"
import { SalesChart } from "@/components/dashboard/SalesChart"
import { AgentsOverview } from "@/components/dashboard/AgentsOverview"
import { RecentOrders } from "@/components/dashboard/RecentOrders"
import { getDashboardKpis, getSalesData } from "@/lib/data/dashboard"
import { getOrders } from "@/lib/data/orders"
import { getAgents } from "@/lib/data/agents"

export const dynamic = "force-dynamic"

export default async function DashboardHome() {
  const [kpis, sales, orders, agents] = await Promise.all([
    getDashboardKpis(),
    getSalesData(),
    getOrders(),
    getAgents(),
  ])

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />

        <KpiRow kpis={kpis} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart sales={sales} />
          </div>
          <div className="lg:col-span-1">
            <AgentsOverview agents={agents} />
          </div>
        </div>

        <RecentOrders orders={orders} />
      </div>
    </Shell>
  )
}
