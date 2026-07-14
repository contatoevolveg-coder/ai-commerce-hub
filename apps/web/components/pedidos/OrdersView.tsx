"use client"

import { useMemo, useState } from "react"
import { Package } from "lucide-react"
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  type Column,
} from "@ai-commerce/ui"
import { FilterBar } from "@/components/shared/FilterBar"
import { StatusFilter, type StatusValue } from "@/components/pedidos/StatusFilter"
import type { Order } from "@/lib/types"

const statusVariants: Record<Order["status"], "success" | "warning" | "danger" | "default"> = {
  delivered: "success",
  processing: "warning",
  shipped: "default",
  cancelled: "danger",
}

const statusLabels: Record<Order["status"], string> = {
  delivered: "Entregue",
  processing: "Processando",
  shipped: "Enviado",
  cancelled: "Cancelado",
}

export interface OrdersViewProps {
  orders: Order[]
}

export function OrdersView({ orders }: OrdersViewProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusValue>("all")
  const [channel, setChannel] = useState("all")

  const channels = useMemo(() => {
    const unique = new Set(orders.map((order) => order.channel))
    return Array.from(unique).sort()
  }, [orders])

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status
      const matchesChannel = channel === "all" || order.channel === channel
      const matchesSearch =
        term === "" ||
        order.id.toLowerCase().includes(term) ||
        order.customer.toLowerCase().includes(term) ||
        order.channel.toLowerCase().includes(term)
      return matchesStatus && matchesChannel && matchesSearch
    })
  }, [orders, search, status, channel])

  const columns: Column<Order>[] = [
    { key: "id", label: "Pedido", align: "left" },
    { key: "customer", label: "Cliente", align: "left" },
    { key: "channel", label: "Canal", align: "left" },
    {
      key: "amount",
      label: "Valor",
      align: "right",
      render: (row) => (
        <span className="font-mono text-primary-text">{row.amount}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "left",
      render: (row) => (
        <Badge variant={statusVariants[row.status]}>
          {statusLabels[row.status]}
        </Badge>
      ),
    },
    { key: "date", label: "Data", align: "left" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        placeholder="Buscar por pedido, cliente ou canal..."
        value={search}
        onChange={setSearch}
      >
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="h-10 rounded-sm border border-border-subtle bg-surface px-3 text-sm text-body focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Todos os canais</option>
          {channels.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FilterBar>

      <StatusFilter value={status} onChange={setStatus} />

      {filteredOrders.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<Package className="h-7 w-7" />}
            title="Nenhum pedido encontrado"
            description="Os pedidos aparecerão aqui assim que forem integrados"
          />
        </Card>
      ) : (
        <Card padding="none">
          <DataTable columns={columns} rows={filteredOrders} className="py-2" />
        </Card>
      )}
    </div>
  )
}
