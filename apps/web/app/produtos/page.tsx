import { PageHeader, Button } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { ProductsView } from "@/components/produtos/ProductsView"
import { getProducts } from "@/lib/data/products"

export default async function ProdutosPage() {
  const products = await getProducts()

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Produtos"
          subtitle="Catálogo e estoque"
          actions={<Button>Novo produto</Button>}
        />

        <ProductsView products={products} />
      </div>
    </Shell>
  )
}
