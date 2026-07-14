import { Users, UserPlus, Receipt } from "lucide-react"
import { PageHeader, StatCard } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { CustomersView } from "@/components/clientes/CustomersView"
import { getCustomers, getCustomersSummary } from "@/lib/data/customers"

export default async function ClientesPage() {
  const [customers, summary] = await Promise.all([
    getCustomers(),
    getCustomersSummary(),
  ])

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader title="Clientes" subtitle="Sua base de clientes" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total de clientes"
            value={String(summary.total)}
            icon={<Users className="h-5 w-5" />}
            accentColor="primary"
          />
          <StatCard
            title="Novos (30 dias)"
            value={String(summary.new30d)}
            icon={<UserPlus className="h-5 w-5" />}
            accentColor="success"
          />
          <StatCard
            title="Ticket médio"
            value={summary.avgTicket}
            icon={<Receipt className="h-5 w-5" />}
            accentColor="ai"
          />
        </div>

        <CustomersView customers={customers} />
      </div>
    </Shell>
  )
}
