import { MiniChart } from "@ai-commerce/ui"
import { salesChart } from "@/lib/mock-data"

export function SalesChart() {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 shadow-sm h-full">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Vendas - Últimos 7 dias</h3>
        <span className="mt-2 text-2xl font-semibold text-primary-text">
          {/* Somando o array para dar um total fake, opcional */}
          R$ {(salesChart.data.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}K
        </span>
      </div>
      <div className="mt-auto">
        <MiniChart data={salesChart.data} color="primary" height={60} />
      </div>
    </div>
  )
}
