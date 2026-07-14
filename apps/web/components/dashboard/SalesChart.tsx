import { MiniChart, EmptyState } from "@ai-commerce/ui"
import { LineChart } from "lucide-react"

function formatarResumoK(totalReais: number): string {
  const totalInteiro = Math.trunc(totalReais)
  const milhares = Math.trunc(totalInteiro / 1000)
  const decimo = Math.trunc((totalInteiro % 1000) / 100)
  return `${milhares}.${decimo}`
}

export function SalesChart({ sales }: { sales: { labels: string[]; data: number[] } }) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 shadow-sm h-full">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Vendas - Últimos 7 dias</h3>
        {sales.data.length > 0 && (
          <span className="mt-2 text-2xl font-semibold text-primary-text">
            R$ {formatarResumoK(sales.data.reduce((a, b) => a + b, 0))}K
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
