import { Job, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { withTenant } from '@ai-commerce/db'
import {
  NomesFilas,
  SyncErpPayloadSchema,
} from '@ai-commerce/core/src/jobs/filas'
import {
  obterCredencialErp,
} from '@ai-commerce/core/src/services/integracoes.service'
import { BlingMockAdapter } from '@ai-commerce/integrations/src/mock/bling.mock'
import { produto, estoque, cliente, conexaoErp } from '@ai-commerce/db'
import { eq, and } from 'drizzle-orm'

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
}

const connection = new Redis(redisOptions)

/**
 * Worker para Sincronização de ERP.
 * Consome a fila SYNC_ERP e atualiza produto/estoque localmente via mock (Fase 6).
 */
export const SyncErpWorker = new Worker(
  NomesFilas.SYNC_ERP,
  async (job: Job) => {
    const data = SyncErpPayloadSchema.parse(job.data)

    let skipJob = false
    await withTenant(data.clienteId, async (tx) => {
      console.log(`[Worker SyncERP] Iniciando sync para tenant ${data.clienteId}, ERP: ${data.erpId}, Direção: ${data.direcao}`)

      // Verifica kill switch
      const [clientData] = await tx
        .select({ aiExecutionEnabled: cliente.aiExecutionEnabled })
        .from(cliente)
        .where(eq(cliente.id, data.clienteId))

      if (clientData && !clientData.aiExecutionEnabled) {
        console.log(`[Worker SyncERP] Kill switch ativo: execução desabilitada para tenant ${data.clienteId}. Job pulado.`)
        skipJob = true
        return
      }

      // Obtém dados da conexão ERP para validar se existe
      const [conexao] = await tx
        .select()
        .from(conexaoErp)
        .where(and(eq(conexaoErp.id, data.erpId), eq(conexaoErp.clienteId, data.clienteId)))

      if (!conexao) {
        throw new Error(`Conexão ERP ${data.erpId} não encontrada para tenant ${data.clienteId}`)
      }
    })

    if (skipJob) return

    // Obter credencial ERP (usa sua própria tx withTenant, então chamamos fora da tx de gravação)
    let credencial: Record<string, string> | null = null
    try {
      credencial = await obterCredencialErp(data.clienteId, data.erpId)
    } catch (err) {
      console.warn(`[Worker SyncERP] Aviso ao obter credencial:`, err)
    }

    if (!credencial) {
      throw new Error(`Não foi possível obter credencial descriptografada para ERP ${data.erpId}`)
    }

    // Instanciar adapter (Mock)
    const adapter = new BlingMockAdapter()

    if (data.direcao === 'importar') {
      const produtosERP = await adapter.listarProdutos(data.clienteId)
      const estoquesERP = await adapter.obterEstoque(data.clienteId, produtosERP.map(p => p.idRemoto))
      
      const estoqueMap = new Map(estoquesERP.map(e => [e.idRemoto, e.quantidade]))

      await withTenant(data.clienteId, async (tx) => {
        for (const p of produtosERP) {
          // Salvar Produto
          const [prodSalvo] = await tx
            .insert(produto)
            .values({
              clienteId: data.clienteId,
              sku: p.sku,
              nome: p.nome,
              categoria: 'Não Definida', // ERP mock não traz categoria, setamos default
              cmvCentavos: BigInt(p.precoCentavos),
              pesoGramas: 0,
            })
            .onConflictDoUpdate({
              target: [produto.clienteId, produto.sku],
              set: { nome: p.nome, cmvCentavos: BigInt(p.precoCentavos) }
            })
            .returning()

          // Salvar Estoque
          const qty = estoqueMap.get(p.idRemoto) || 0
          
          await tx
            .insert(estoque)
            .values({
              clienteId: data.clienteId,
              produtoId: prodSalvo.id,
              quantidadeDisponivel: qty,
              quantidadeReservada: 0,
              atualizadoEm: new Date(),
            })
            .onConflictDoUpdate({
              target: [estoque.produtoId],
              set: { quantidadeDisponivel: qty, atualizadoEm: new Date() }
            })
        }
      })
      console.log(`[Worker SyncERP] Sync finalizado. Importados ${produtosERP.length} produtos para tenant ${data.clienteId}`)
    } else {
      console.log(`[Worker SyncERP] Exportação não implementada no mock ainda.`)
    }
  },
  {
    connection,
    concurrency: 2,
  }
)

SyncErpWorker.on('completed', (job) => {
  console.log(`[Job Concluído] Fila: ${job.queueName} | JobId: ${job.id}`)
})

SyncErpWorker.on('failed', (job, err) => {
  console.error(`[Job Falhou] Fila: ${job?.queueName} | JobId: ${job?.id}`, err)
})
