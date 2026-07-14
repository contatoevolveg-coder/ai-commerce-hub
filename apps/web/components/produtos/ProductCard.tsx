import { Badge, Card } from "@ai-commerce/ui"
import type { Product } from "@/lib/types"

export const stockVariants: Record<Product["status"], "success" | "warning" | "danger"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
}

export const stockLabels: Record<Product["status"], string> = {
  in_stock: "Em estoque",
  low_stock: "Estoque baixo",
  out_of_stock: "Esgotado",
}

export interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="aspect-square w-full rounded-sm bg-surface-raised" />
      <div className="flex flex-col gap-1">
        <h3 className="truncate text-sm font-medium text-primary-text">
          {product.name}
        </h3>
        <span className="font-mono text-xs text-muted">{product.sku}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="font-semibold text-primary-text">{product.price}</span>
        <Badge variant={stockVariants[product.status]}>
          {stockLabels[product.status]}
        </Badge>
      </div>
    </Card>
  )
}
