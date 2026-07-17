import { Job, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { withTenant } from '@ai-commerce/db'
import {
  NomesFilas,
  DiagnosticoPayloadSchema,
} from '@ai-commerce/core/src/jobs/filas'
import { analisarProduto } from '@ai-commerce/core/src/ai/diagnostico.agent'
import { registrarDecisao } from '@ai-commerce/core/src/ai/decisions.service'
import { produto, cliente } from '@ai-commerce/db'
import { eq, and } from 'drizzle-orm'
import { createHash } from 'node:crypto'

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
}

const connection = new Redis(redisOptions)

/**
 * Worker para Processar Diagnóstico.
 * Em um cenário real, chamaria a LLM para sugerir melhorias de SEO, etc.
 */
export const DiagnosticoWorker = new Worker(
  NomesFilas.DIAGNOSTICO,
  async (job: Job) => {
    // 1. Validar payload rígido na fronteira
    const data = DiagnosticoPayloadSchema.parse(job.data)

    // 2. Executar TODA a lógica isolada por tenant
    await withTenant(data.clienteId, async (tx) => {
      console.log(`[Worker] Iniciando diagnóstico para tenant ${data.clienteId}, entidade ${data.entidadeId}`)

      if (data.entidade === 'produto') {
        const [prod] = await tx
          .select()
          .from(produto)
          .where(
            and(eq(produto.id, data.entidadeId), eq(produto.clienteId, data.clienteId))
          )

        // Verifica kill switch
        const [clientData] = await tx
          .select({ aiExecutionEnabled: cliente.aiExecutionEnabled })
          .from(cliente)
          .where(eq(cliente.id, data.clienteId))

        if (clientData && !clientData.aiExecutionEnabled) {
          console.log(`[Worker] Kill switch ativo: execução de IA desabilitada para tenant ${data.clienteId}. Job pulado.`)
          return
        }

        if (!prod) {
          throw new Error(`Produto ${data.entidadeId} não encontrado para tenant ${data.clienteId}`)
        }

        console.log(`[Worker] Diagnosticando produto via LLM: ${prod.nome}...`)
        
        try {
          const { resultado, usage } = await analisarProduto({
            nome: prod.nome,
            categoria: prod.categoria,
            preco: prod.cmvCentavos || BigInt(0), // Simulando preço
          })

          console.log(`[Worker] Diagnóstico concluído. Confiança: ${resultado.confianca}%`)
          
          // Gera um hash determinístico da entrada
          const hashInput = createHash('sha256')
            .update(JSON.stringify({ id: prod.id, nome: prod.nome }))
            .digest('hex')

          // Grava a decisão usando as regras da M3
          await registrarDecisao(tx, {
            clienteId: data.clienteId,
            agenteNome: 'Agente de Diagnóstico (SEO)',
            versaoPrompt: 'v1.0.0',
            modelo: 'gpt-4o-mini',
            inputHash: hashInput,
            proposta: {
              tituloSugerido: resultado.tituloSugerido,
              descricaoSugerida: resultado.descricaoSugerida,
            },
            raciocinio: resultado.motivos.join('. '),
            impactoEstimadoCentavos: BigInt(0), // Diagnóstico de cadastro tem impacto indireto
            confianca: resultado.confianca,
            tokensIn: usage.promptTokens,
            tokensOut: usage.completionTokens,
          })
          
          console.log(`[Worker] Decisão proposta salva no Audit Log (Tabela decisao).`)

        } catch (error) {
          console.error(`[Worker] Erro ao chamar AI SDK:`, error)
          throw error
        }
      }
    })
  },
  {
    connection,
    // Limite de processamento concorrente global (tuning)
    concurrency: 5,
    // (BullMQ Pro) limiter: { max: 10, duration: 1000 }
  }
)

DiagnosticoWorker.on('completed', (job) => {
  console.log(`[Job Concluído] Fila: ${job.queueName} | JobId: ${job.id}`)
})

DiagnosticoWorker.on('failed', (job, err) => {
  console.error(`[Job Falhou] Fila: ${job?.queueName} | JobId: ${job?.id}`, err)
})
