import type { Product } from "../types"
import { listarProdutos } from "@ai-commerce/core/src/services/produtos.service"
import { getClienteIdAtual } from "../tenant"
import { formatBRL } from "../format"

function statusEstoque(qtd: number): Product["status"] {
  if (qtd <= 0) return "out_of_stock"
  if (qtd <= 10) return "low_stock"
  return "in_stock"
}

export async function getProducts(): Promise<Product[]> {
  try {
    const rows = await listarProdutos(getClienteIdAtual())
    return rows.map((r): Product => {
      const stock = r.quantidadeDisponivel ?? 0
      return {
        id: r.id,
        name: r.nome,
        sku: r.sku,
        price: formatBRL(r.precoRemotoCentavos ?? 0n),
        stock,
        status: statusEstoque(stock),
      }
    })
  } catch (e) {
    console.error("[products] getProducts:", e instanceof Error ? e.message : e)
    return []
  }
}
