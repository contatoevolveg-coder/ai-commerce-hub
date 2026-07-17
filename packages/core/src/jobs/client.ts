import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { gerarIdIdempotencia } from './idempotencia'

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
}

// Singleton connection to avoid connection limits in serverless/BFF
const connection = new Redis(redisOptions)

const queues: Record<string, Queue> = {}

function getQueue(nome: string): Queue {
  if (!queues[nome]) {
    queues[nome] = new Queue(nome, { connection })
  }
  return queues[nome]
}

/**
 * Enfileira um job garantindo idempotência baseada no hash (Tenant + Payload).
 * Se o mesmo payload for enviado para o mesmo tenant antes do job anterior processar (ou expirar),
 * o Redis ignorará a duplicata via JobId do BullMQ.
 */
export async function enfileirarJob<T>(
  clienteId: string,
  fila: string,
  payload: T
): Promise<void> {
  const q = getQueue(fila)
  const jobId = gerarIdIdempotencia(clienteId, payload)
  
  await q.add(
    fila,
    { clienteId, ...payload }, // Injeta clienteId no topo do data
    {
      jobId, // BullMQ ignores jobs with the same jobId if they are waiting/active
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true, // Limpa o job completado para não poluir Redis
      removeOnFail: false,    // Mantém falhas para inspecionar
    }
  )
}
