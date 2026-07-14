import { MiniChart, EmptyState } from "@ai-commerce/ui"
import { LineChart } from "lucide-react"

export function SalesChart({ sales }: { sales: { labels: string[]; data: number[] } }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 shadow-sm h-full">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Vendas - Últimos 7 dias</h3>
        {sales.data.length > 0 && (
          <span className="mt-2 text-2xl font-semibold text-primary-text">
            R$ {(sales.data.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}K
          </span>
        )}
      </div>
      {sales.data.length === 0 ? (
        <EmptyState
          icon={<LineChart className="h-6 w-6" />}
          title="Sem dados de vendas ainda"
        />
      ) : (
        <div className="mt-auto">
          <MiniChart data={sales.data} color="primary" height={60} />
        </div>
      )}
    </div>
  )
}
