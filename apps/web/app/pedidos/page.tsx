import { ShoppingCart, Clock, Truck, XCircle } from "lucide-react"
import { PageHeader, StatCard } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { OrdersView } from "@/components/pedidos/OrdersView"
import { getOrders, getOrdersSummary } from "@/lib/data/orders"

export const dynamic = "force-dynamic"

export default async function PedidosPage() {
  const [orders, summary] = await Promise.all([
    getOrders(),
    getOrdersSummary(),
  ])

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Pedidos"
          subtitle="Gerencie os pedidos de todos os canais"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total"
            value={String(summary.total)}
            icon={<ShoppingCart className="h-5 w-5" />}
            accentColor="primary"
          />
          <StatCard
            title="Pendentes"
            value={String(summary.pending)}
            icon={<Clock className="h-5 w-5" />}
            accentColor="warning"
          />
          <StatCard
            title="Enviados"
            value={String(summary.shipped)}
            icon={<Truck className="h-5 w-5" />}
            accentColor="ai"
          />
          <StatCard
            title="Cancelados"
            value={String(summary.cancelled)}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>

        <OrdersView orders={orders} />
      </div>
    </Shell>
  )
}
