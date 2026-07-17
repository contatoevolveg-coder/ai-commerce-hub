import { PageHeader, Card, StatCard } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { getAnalytics } from "@ai-commerce/core/src/services/analytics.service"
import { getClienteIdAtual } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function RelatoriosPage() {
  const clienteId = getClienteIdAtual()
  const data = await getAnalytics(clienteId, 30)

  const totalReceita = data.pedidos.reduce((acc, p) => acc + p.total, 0n)
  
  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Relatórios (Snapshot Diário)"
          subtitle="Agregação dos KPIs de Estoque, Margens e Giro"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Receita (30 dias)"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(totalReceita) / 100)}
          />
          <StatCard
            title="Pedidos Pagos"
            value={data.pedidos.length.toString()}
          />
          <StatCard
            title="Unidades Vendidas"
            value={data.itens.reduce((acc, item) => acc + item.quantidade, 0).toString()}
          />
        </div>

        <Card padding="md">
          <h3 className="mb-4 text-lg font-semibold leading-none tracking-tight">Produtos com Maior Giro (Mock/Apresentação)</h3>
          <div>
            <div className="text-sm text-muted">
              Esta visão consolida as informações da F7 (Motor de Estoque e Margem) calculadas em D-1.
            </div>
            {/* Aqui entrariam os dados das tabelas de negócio do F7 se aplicável */}
          </div>
        </Card>
      </div>
    </Shell>
  )
}
