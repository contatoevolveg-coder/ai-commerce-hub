import 'dotenv/config'
import { db } from '@ai-commerce/db'
import { DiagnosticoWorker } from './workers/diagnostico.worker'

async function bootstrap() {
  console.log('🚀 [Worker] Inicializando AI Commerce Hub Worker Engine...')
  
  if (!process.env.APP_DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.error('❌ [CRITICAL] APP_DATABASE_URL não configurada no worker em produção.')
    process.exit(1)
  }

  // Verifica conexão com o banco
  try {
    await db.execute('SELECT 1')
    console.log('✅ [Worker] Conexão com o banco de dados estabelecida.')
  } catch (error) {
    console.error('❌ [Worker] Erro ao conectar no banco de dados:', error)
    process.exit(1)
  }

  // O DiagnosticoWorker já começa a puxar jobs do Redis no instante que é importado e instanciado.
  // Podemos adicionar mais workers aqui, ex: SyncBlingWorker, SmartPricingWorker...
  
  console.log(`✅ [Worker] Workers registrados e aguardando tarefas na fila:`)
  console.log(`   - ${DiagnosticoWorker.name}`)
}

// Trata encerramento graceful (Ctrl+C, Docker stop)
process.on('SIGTERM', async () => {
  console.log('Sinal SIGTERM recebido, encerrando workers graciosamente...')
  await DiagnosticoWorker.close()
  process.exit(0)
})

bootstrap().catch((err) => {
  console.error('Erro fatal no Worker Engine:', err)
  process.exit(1)
})
