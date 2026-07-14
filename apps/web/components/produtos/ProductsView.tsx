"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  type Column,
} from "@ai-commerce/ui"
import {
  ProductCard,
  stockLabels,
  stockVariants,
} from "@/components/produtos/ProductCard"
import { ViewToggle, type ViewMode } from "@/components/produtos/ViewToggle"
import type { Product } from "@/lib/types"

export interface ProductsViewProps {
  products: Product[]
}

export function ProductsView({ products }: ProductsViewProps) {
  const [view, setView] = useState<ViewMode>("grid")

  if (products.length === 0) {
    return (
      <Card padding="none">
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title="Nenhum produto cadastrado"
          description="Cadastre seu primeiro produto para começar a vender"
          action={<Button>Adicionar primeiro produto</Button>}
        />
      </Card>
    )
  }

  const columns: Column<Product>[] = [
    { key: "name", label: "Produto", align: "left" },
    {
      key: "sku",
      label: "SKU",
      align: "left",
      render: (row) => (
        <span className="font-mono text-xs text-muted">{row.sku}</span>
      ),
    },
    {
      key: "price",
      label: "Preço",
      align: "right",
      render: (row) => (
        <span className="font-semibold text-primary-text">{row.price}</span>
      ),
    },
    { key: "stock", label: "Estoque", align: "right" },
    {
      key: "status",
      label: "Status",
      align: "left",
      render: (row) => (
        <Badge variant={stockVariants[row.status]}>
          {stockLabels[row.status]}
        </Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </span>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Card padding="none">
          <DataTable columns={columns} rows={products} className="py-2" />
        </Card>
      )}
    </div>
  )
}
