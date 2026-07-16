import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from './schema'
import { DEV_CLIENTE_ID } from './dev-tenant'

/**
 * Carrega o .env da raiz do monorepo (o seed roda em packages/db, mas os segredos
 * ficam na raiz). Parser mínimo, sem dependência de dotenv — só para DX de `pnpm db:seed`.
 * Não sobrescreve variáveis já presentes no ambiente.
 */
function carregarEnvRaiz() {
  try {
    const conteudo = readFileSync(join(__dirname, '..', '..', '..', '.env'), 'utf8')
    for (const linha of conteudo.split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    // .env ausente — segue com o que já estiver no ambiente.
  }
}
carregarEnvRaiz()

/**
 * Seed determinístico e IDEMPOTENTE do tenant de demonstração.
 *
 * - Usa a conexão PRIVILEGIADA (DATABASE_URL). Isto é legítimo: RLS protege as queries
 *   de NEGÓCIO da aplicação (que rodam sob app_role via APP_DATABASE_URL), não scripts
 *   administrativos de setup/seed — mesma distinção usada nos testes de isolamento.
 * - Idempotente: apaga o cliente demo (cascade limpa todo o subgrafo) e reinsere do zero.
 *   Rodar `pnpm db:seed` N vezes sempre resulta no mesmo estado, sem duplicar linhas.
 * - Catálogo e preços vêm da skill marketplace-domain (SKUs de referência INF-*).
 */

const {
  cliente,
  canal,
  produto,
  produtoEspelho,
  estoque,
  comprador,
  pedido,
  itemPedido,
  agente,
  execucaoAgente,
} = schema

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ai_commerce'

async function main() {
  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql, { schema })

  console.log('[seed] Limpando tenant de demonstração (idempotente)…')
  // onDelete: cascade em todas as FKs → apagar o cliente limpa todo o subgrafo.
  await db.delete(cliente).where(eq(cliente.id, DEV_CLIENTE_ID))

  console.log('[seed] Cliente demo…')
  await db.insert(cliente).values({
    id: DEV_CLIENTE_ID,
    nome: 'Loja Demo — Infinoos',
    cnpj: '12.345.678/0001-90',
    regimeTributario: 'simples',
  })

  console.log('[seed] Canal Mercado Livre…')
  const [canalMl] = await db
    .insert(canal)
    .values({
      clienteId: DEV_CLIENTE_ID,
      tipo: 'mercado_livre',
      nome: 'Mercado Livre',
      status: 'ativo',
    })
    .returning({ id: canal.id })

  // Catálogo de referência (skill marketplace-domain). cmv/preço em centavos (bigint).
  const catalogo = [
    { sku: 'INF-1042', nome: 'Fone Bluetooth TWS Pro ANC', categoria: 'Áudio', cmv: 6840n, preco: 18990n, peso: 250, estoque: 42 },
    { sku: 'INF-2871', nome: 'Suporte Articulado Monitor 27"', categoria: 'Acessórios', cmv: 4120n, preco: 12990n, peso: 1800, estoque: 8 },
    { sku: 'INF-0553', nome: 'Cabo USB-C 100W Nylon 2m', categoria: 'Cabos', cmv: 890n, preco: 3990n, peso: 120, estoque: 0 },
    { sku: 'INF-3390', nome: 'Teclado Mecânico 75% Hot-Swap', categoria: 'Periféricos', cmv: 17200n, preco: 44900n, peso: 900, estoque: 15 },
    { sku: 'INF-0917', nome: 'Luminária de Mesa LED Dimerizável', categoria: 'Iluminação', cmv: 3350n, preco: 9990n, peso: 700, estoque: 120 },
  ]

  console.log('[seed] Produtos, estoque e espelho de canal…')
  const produtoIds: string[] = []
  for (const item of catalogo) {
    const [p] = await db
      .insert(produto)
      .values({
        clienteId: DEV_CLIENTE_ID,
        sku: item.sku,
        nome: item.nome,
        categoria: item.categoria,
        cmvCentavos: item.cmv,
        pesoGramas: item.peso,
      })
      .returning({ id: produto.id })
    produtoIds.push(p.id)

    await db.insert(estoque).values({
      clienteId: DEV_CLIENTE_ID,
      produtoId: p.id,
      quantidadeDisponivel: item.estoque,
      quantidadeReservada: 0,
    })

    await db.insert(produtoEspelho).values({
      clienteId: DEV_CLIENTE_ID,
      produtoId: p.id,
      canalId: canalMl.id,
      skuRemoto: `MLB-${item.sku}`,
      precoRemotoCentavos: item.preco,
      estoqueRemoto: item.estoque,
      statusRemoto: 'active',
      divergente: false,
      ultimaSincronizacao: new Date(),
    })
  }

  console.log('[seed] Compradores…')
  const compradoresSeed = [
    { nome: 'Ana Beatriz Souza', email: 'ana.souza@example.com' },
    { nome: 'Carlos Mendes', email: 'carlos.mendes@example.com' },
    { nome: 'Fernanda Lima', email: 'fernanda.lima@example.com' },
    { nome: 'Rafael Oliveira', email: 'rafael.oliveira@example.com' },
  ]
  const compradorIds: string[] = []
  for (const c of compradoresSeed) {
    const [row] = await db
      .insert(comprador)
      .values({ clienteId: DEV_CLIENTE_ID, nome: c.nome, email: c.email })
      .returning({ id: comprador.id })
    compradorIds.push(row.id)
  }

  console.log('[seed] Pedidos e itens…')
  const now = Date.now()
  const diasAtras = (n: number) => new Date(now - n * 86_400_000)
  const precoDe = (i: number) => catalogo[i].preco

  const pedidosSeed: {
    compradorIdx: number
    itens: [number, number][]
    status: 'novo' | 'pago' | 'enviado' | 'entregue' | 'cancelado'
    dias: number
    numero: string
  }[] = [
    { compradorIdx: 0, itens: [[0, 1]], status: 'entregue', dias: 2, numero: '2000000001' },
    { compradorIdx: 1, itens: [[3, 1], [2, 2]], status: 'enviado', dias: 3, numero: '2000000002' },
    { compradorIdx: 2, itens: [[4, 2]], status: 'pago', dias: 5, numero: '2000000003' },
    { compradorIdx: 3, itens: [[1, 1]], status: 'novo', dias: 6, numero: '2000000004' },
    { compradorIdx: 0, itens: [[0, 1], [4, 1]], status: 'entregue', dias: 9, numero: '2000000005' },
    { compradorIdx: 1, itens: [[2, 3]], status: 'cancelado', dias: 12, numero: '2000000006' },
    { compradorIdx: 2, itens: [[3, 1]], status: 'entregue', dias: 18, numero: '2000000007' },
    { compradorIdx: 3, itens: [[4, 1], [2, 1]], status: 'pago', dias: 24, numero: '2000000008' },
  ]

  for (const ped of pedidosSeed) {
    const total = ped.itens.reduce((acc, [idx, qtd]) => acc + precoDe(idx) * BigInt(qtd), 0n)
    const [row] = await db
      .insert(pedido)
      .values({
        clienteId: DEV_CLIENTE_ID,
        canalId: canalMl.id,
        compradorId: compradorIds[ped.compradorIdx],
        numeroPedidoRemoto: ped.numero,
        status: ped.status,
        totalCentavos: total,
        criadoEm: diasAtras(ped.dias),
      })
      .returning({ id: pedido.id })

    for (const [idx, qtd] of ped.itens) {
      await db.insert(itemPedido).values({
        clienteId: DEV_CLIENTE_ID,
        pedidoId: row.id,
        produtoId: produtoIds[idx],
        quantidade: qtd,
        precoUnitarioCentavos: precoDe(idx),
      })
    }
  }

  console.log('[seed] Agentes e execuções…')
  const agentesSeed = [
    { nome: 'Precificação Dinâmica', tipo: 'pricing' as const, nivel: 2 },
    { nome: 'Monitor de Estoque', tipo: 'estoque' as const, nivel: 1 },
  ]
  const agenteIds: string[] = []
  for (const a of agentesSeed) {
    const [row] = await db
      .insert(agente)
      .values({
        clienteId: DEV_CLIENTE_ID,
        nome: a.nome,
        tipo: a.tipo,
        nivelAutonomia: a.nivel,
        versaoPrompt: 'v1.0.0',
        ativo: true,
      })
      .returning({ id: agente.id })
    agenteIds.push(row.id)
  }

  const execucoesSeed = [
    { agenteIdx: 0, contexto: { acao: 'Analisou 42 SKUs e sugeriu 3 ajustes de preço' }, horas: 2 },
    { agenteIdx: 1, contexto: { acao: 'Detectou ruptura em INF-0553 (Cabo USB-C)' }, horas: 5 },
    { agenteIdx: 0, contexto: { acao: 'Reprecificou INF-3390 (+4,2% de margem)' }, horas: 27 },
  ]
  for (const e of execucoesSeed) {
    await db.insert(execucaoAgente).values({
      clienteId: DEV_CLIENTE_ID,
      agenteId: agenteIds[e.agenteIdx],
      status: 'concluido',
      contexto: e.contexto,
      iniciadoEm: new Date(now - e.horas * 3_600_000),
      finalizadoEm: new Date(now - e.horas * 3_600_000 + 4000),
    })
  }

  console.log(`[seed] Concluído ✔  tenant demo: ${DEV_CLIENTE_ID}`)

  const { decisao, tarefa, papel, usuario } = schema

  console.log('[seed] Usuário Administrador (para aprovações)…')
  const [papelRow] = await db.insert(papel)
    .values({ codigo: 'admin', descricao: 'Administrador' })
    .onConflictDoUpdate({ target: papel.codigo, set: { descricao: 'Administrador' } })
    .returning({ id: papel.id })

  await db.insert(usuario)
    .values({
      id: '00000000-0000-0000-0000-000000000002',
      clienteId: DEV_CLIENTE_ID,
      papelId: papelRow.id,
      nome: 'Admin',
      email: 'admin@demo.com',
      senhaHash: '$2b$10$Xm1T5bI5X3Q1/aA6N6.8u.O2l2v8oH8eL0a3b2o0T2O/4h2V.0RzK' // admin123
    })

  console.log('[seed] Decisões e Tarefas de Governança…')
  const [decisaoRow] = await db
    .insert(decisao)
    .values({
      clienteId: DEV_CLIENTE_ID,
      agenteId: agenteIds[0],
      versaoPrompt: 'v1.1.0',
      modelo: 'claude-3-5-sonnet',
      inputHash: 'hashficticio12345',
      // proposta jsonb: dinheiro como STRING de centavos (bigint não é serializável em JSON).
      // precoPisoCentavos é fixture de demo; em produção o proponente calcula com calcularMargem.
      proposta: {
        tipo: 'ajuste_preco',
        sku: catalogo[0].sku,
        precoAtualCentavos: catalogo[0].preco.toString(),
        precoPropostoCentavos: '19500',
        precoPisoCentavos: '12000',
      },
      raciocinio: 'Aumentando o preço em R$ 5,10 devido à alta demanda recente e margem espremida pelo custo logístico.',
      impactoEstimadoCentavos: 510n,
      confianca: 92,
      estado: 'pending_review',
    })
    .returning({ id: decisao.id })

  await db.insert(tarefa).values([
    {
      clienteId: DEV_CLIENTE_ID,
      tipo: 'aprovacao_decisao',
      titulo: `Aprovar Reprecificação de ${catalogo[0].nome}`,
      descricao: `O agente ${agentesSeed[0].nome} propôs um ajuste de preço que precisa de revisão manual.`,
      decisaoId: decisaoRow.id,
      status: 'aberta',
    },
    {
      clienteId: DEV_CLIENTE_ID,
      tipo: 'diagnostico_cadastro',
      titulo: 'Completar NCM de Produto',
      descricao: `O produto ${catalogo[2].nome} está sem NCM preenchido. Isso impede a emissão de nota fiscal.`,
      status: 'aberta',
    }
  ])

  await sql.end()
  process.exit(0)
}

main().catch((e) => {
  console.error('[seed] Falhou:', e)
  process.exit(1)
})
