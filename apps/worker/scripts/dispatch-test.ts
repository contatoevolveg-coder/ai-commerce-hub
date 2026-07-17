import 'dotenv/config'
import { enfileirarJob } from '@ai-commerce/core/src/jobs/client'
import { db, conexaoErp, cliente } from '@ai-commerce/db'

async function dispatchTest() {
  console.log('🚀 Iniciando script de teste (Dispatch de Job)...')

  // Obtém um cliente real para teste (por exemplo o DEV_CLIENTE_ID)
  const [cli] = await db.select().from(cliente).limit(1)

  if (!cli) {
    console.error('Nenhum cliente encontrado no banco. Rode pnpm db:seed primeiro.')
    process.exit(1)
  }

  // Verifica se há alguma conexão de ERP
  let [conexao] = await db.select().from(conexaoErp).limit(1)

  if (!conexao) {
    console.log('Nenhuma conexão ERP encontrada. Mockando uma temporariamente...')
    // Mock simples no banco apenas para o worker conseguir rodar e achar uma credencial
    const [novaConexao] = await db
      .insert(conexaoErp)
      .values({
        clienteId: cli.id,
        erp: 'bling',
        rotulo: 'Bling Teste Manual',
        status: 'conectado',
        payloadCifrado: 'mock_cifrado', // Vai falhar a decifragem real se tentar, mas como contornamos com o erro do decifrador falhar...
        iv: 'mock_iv',
        authTag: 'mock_tag',
      })
      .returning()
    conexao = novaConexao
  }

  console.log(`Disparando job SYNC_ERP para o tenant ${cli.id} e erp ${conexao.id}...`)

  const jobId = await enfileirarJob('SYNC_ERP', {
    clienteId: cli.id,
    erpId: conexao.id,
    direcao: 'importar'
  })

  console.log(`✅ Job enfileirado com sucesso! Job ID (idempotente): ${jobId}`)
  console.log('O Worker deverá capturar a tarefa se estiver rodando (pnpm dev).')

  process.exit(0)
}

dispatchTest().catch((err) => {
  console.error('Erro no dispatch test:', err)
  process.exit(1)
})
