"use client"

import { useMemo, useState } from "react"
import { Users } from "lucide-react"
import {
  Card,
  DataTable,
  EmptyState,
  type Column,
} from "@ai-commerce/ui"
import { FilterBar } from "@/components/shared/FilterBar"
import type { Customer } from "@/lib/types"

export interface CustomersViewProps {
  customers: Customer[]
}

export function CustomersView({ customers }: CustomersViewProps) {
  const [search, setSearch] = useState("")

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (term === "") return customers
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
    )
  }, [customers, search])

  const columns: Column<Customer>[] = [
    { key: "name", label: "Nome", align: "left" },
    {
      key: "email",
      label: "Email",
      align: "left",
      render: (row) => <span className="text-muted">{row.email}</span>,
    },
    { key: "orders", label: "Pedidos", align: "left" },
    {
      key: "totalSpent",
      label: "Total gasto",
      align: "right",
      render: (row) => (
        <span className="font-mono text-primary-text">{row.totalSpent}</span>
      ),
    },
    { key: "since", label: "Cliente desde", align: "left" },
  ]

  if (customers.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Nenhum cliente ainda"
          description="Seus clientes aparecerão aqui conforme as vendas acontecerem"
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        placeholder="Buscar por nome ou email"
        value={search}
        onChange={setSearch}
      />

      {filteredCustomers.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="Nenhum cliente encontrado"
            description="Tente ajustar a busca para encontrar o cliente"
          />
        </Card>
      ) : (
        <Card padding="none">
          <DataTable
            columns={columns}
            rows={filteredCustomers}
            className="py-2"
          />
        </Card>
      )}
    </div>
  )
}
