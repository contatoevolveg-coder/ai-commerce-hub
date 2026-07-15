import { eq } from 'drizzle-orm'
import { withTenant, produto, estoque, produtoEspelho } from '@ai-commerce/db'

/**
 * Lista o catálogo do tenant com estoque e preço espelhado no canal.
 * Toda query passa por withTenant (seta a variável de sessão do RLS) e ainda filtra
 * cliente_id explicitamente — defesa em profundidade (AGENTS.md regra 3).
 */
export function listarProdutos(clienteId: string) {
  return withTenant(clienteId, async (tx) => {
    return await tx
      .select({
        id: produto.id,
        sku: produto.sku,
        nome: produto.nome,
        categoria: produto.categoria,
        cmvCentavos: produto.cmvCentavos,
        precoRemotoCentavos: produtoEspelho.precoRemotoCentavos,
        quantidadeDisponivel: estoque.quantidadeDisponivel,
      })
      .from(produto)
      .leftJoin(estoque, eq(estoque.produtoId, produto.id))
      .leftJoin(produtoEspelho, eq(produtoEspelho.produtoId, produto.id))
      .where(eq(produto.clienteId, clienteId))
      .orderBy(produto.nome)
  })
}

export type ProdutoRow = Awaited<ReturnType<typeof listarProdutos>>[number]
