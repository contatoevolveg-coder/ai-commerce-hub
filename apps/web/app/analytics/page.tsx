import { PageHeader, MiniChart, BarChart } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { ChartCard } from "@/components/analytics/ChartCard"
import { PeriodSelector } from "@/components/analytics/PeriodSelector"
import { getAnalytics } from "@/lib/data/analytics"

export default async function AnalyticsPage() {
  const analytics = await getAnalytics("30d")

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Analytics"
          subtitle="Métricas e tendências da operação"
          actions={<PeriodSelector />}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Receita" isEmpty={analytics.revenue.length === 0}>
            <MiniChart data={analytics.revenue} color="primary" height={120} />
          </ChartCard>

          <ChartCard
            title="Pedidos por canal"
            isEmpty={analytics.ordersByChannel.length === 0}
          >
            <BarChart data={analytics.ordersByChannel} color="ai" />
          </ChartCard>

          <ChartCard
            title="Taxa de conversão"
            isEmpty={analytics.conversion.length === 0}
          >
            <MiniChart data={analytics.conversion} color="success" height={120} />
          </ChartCard>

          <ChartCard
            title="Top produtos"
            isEmpty={analytics.topProducts.length === 0}
          >
            <ul className="flex flex-col divide-y divide-border-subtle">
              {analytics.topProducts.map((product) => (
                <li
                  key={product.name}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm text-body">{product.name}</span>
                  <span className="font-mono text-sm font-medium text-primary-text">
                    {product.value}
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </div>
    </Shell>
  )
}
