import { Shell } from '@/components/Shell'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { SalesChart } from '@/components/dashboard/SalesChart'
import { AgentsOverview } from '@/components/dashboard/AgentsOverview'
import { RecentOrders } from '@/components/dashboard/RecentOrders'

export default function DashboardHome() {
  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-primary-text">Dashboard</h1>
        
        {/* Row 1: 4 KPIs */}
        <KpiRow />
        
        {/* Row 2: Vendas e Agentes (Grid 2 cols, 2/3 vs 1/3) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <div className="lg:col-span-1">
            <AgentsOverview />
          </div>
        </div>
        
        {/* Row 3: Pedidos Recentes */}
        <RecentOrders />
      </div>
    </Shell>
  )
}
