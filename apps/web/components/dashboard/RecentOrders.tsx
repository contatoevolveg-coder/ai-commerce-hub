import { DataTable, Column, Badge } from "@ai-commerce/ui"
import { Order, recentOrders } from "@/lib/mock-data"

export function RecentOrders() {
  const columns: Column<Order>[] = [
    { key: "id", label: "Pedido", align: "left" },
    { key: "customer", label: "Cliente", align: "left" },
    { key: "date", label: "Data", align: "left" },
    { 
      key: "amount", 
      label: "Valor", 
      align: "right",
      render: (row) => <span className="font-mono text-primary-text">{row.amount}</span>
    },
    { 
      key: "status", 
      label: "Status", 
      align: "right",
      render: (row) => {
        const variants: Record<string, "success" | "warning" | "danger" | "default"> = {
          delivered: "success",
          processing: "warning",
          shipped: "default",
          cancelled: "danger"
        }
        
        const labels: Record<string, string> = {
          delivered: "Entregue",
          processing: "Processando",
          shipped: "Enviado",
          cancelled: "Cancelado"
        }

        return <Badge variant={variants[row.status]}>{labels[row.status]}</Badge>
      }
    },
  ]

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Pedidos Recentes</h3>
      </div>
      <DataTable columns={columns} rows={recentOrders} className="pb-2" />
    </div>
  )
}
