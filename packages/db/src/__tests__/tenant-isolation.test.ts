import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { db } from '../index'
import { withTenant } from '../tenant-context'
import { produto } from '../schema'
import { verificarBancoDisponivel } from './setup'

let dbOk = false
let motivoSkip = ''

// Conexão PRIVILEGIADA usada só para arranjar os fixtures do teste (criar os
// dois tenants). Isto é legítimo: RLS protege as queries de NEGÓCIO da
// aplicação, não scripts administrativos de setup/seed — é exatamente para
// isso que existe a distinção DATABASE_URL (privilegiada) vs APP_DATABASE_URL
// (app_role, usada pelo `db` importado acima).
const adminSql = postgres(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ai_commerce',
  { max: 1 },
)

let clienteAId: string
let clienteBId: string
let produtoBId: string

beforeAll(async () => {
  const status = await verificarBancoDisponivel()
  dbOk = status.disponivel
  motivoSkip = status.motivo ?? ''
  if (!dbOk) {
    console.warn(
      `[tenant-isolation.test.ts] pulando: ${motivoSkip}. Rode "docker compose up -d && pnpm db:push" e tente de novo.`,
    )
    return
  }

  const [clienteA] = await adminSql`
    insert into cliente (nome) values ('Tenant A — teste isolamento') returning id
  `
  const [clienteB] = await adminSql`
    insert into cliente (nome) values ('Tenant B — teste isolamento') returning id
  `
  clienteAId = clienteA.id
  clienteBId = clienteB.id

  const [produtoB] = await adminSql`
    insert into produto (cliente_id, sku, nome, categoria, cmv_centavos, peso_gramas)
    values (${clienteBId}, 'SKU-TENANT-B', 'Produto do Tenant B', 'teste', 1000, 100)
    returning id
  `
  produtoBId = produtoB.id

  await adminSql`
    insert into produto (cliente_id, sku, nome, categoria, cmv_centavos, peso_gramas)
    values (${clienteAId}, 'SKU-TENANT-A', 'Produto do Tenant A', 'teste', 1000, 100)
  `
})

afterAll(async () => {
  if (dbOk) {
    await adminSql`delete from cliente where id in (${clienteAId}, ${clienteBId})`
  }
  await adminSql.end({ timeout: 1 }).catch(() => undefined)
})

describe('tenant-isolation (M1 — critério de aceite)', () => {
  test('SELECT sem WHERE, dentro do contexto do tenant A, nunca retorna linha do tenant B', async (ctx) => {
    if (!dbOk) return ctx.skip()

    const linhas = await withTenant(clienteAId, (tx) => tx.select().from(produto))

    expect(linhas.length).toBeGreaterThan(0)
    expect(linhas.every((l) => l.clienteId === clienteAId)).toBe(true)
    expect(linhas.some((l) => l.id === produtoBId)).toBe(false)
  })

  test('SELECT explícito pelo id do produto do tenant B, dentro do contexto do tenant A, retorna 0 linhas', async (ctx) => {
    if (!dbOk) return ctx.skip()

    const linhas = await withTenant(clienteAId, (tx) =>
      tx.select().from(produto).where(eq(produto.id, produtoBId)),
    )

    expect(linhas.length).toBe(0)
  })

  test('INSERT com cliente_id de outro tenant é rejeitado pelo WITH CHECK da policy', async (ctx) => {
    if (!dbOk) return ctx.skip()

    await expect(
      withTenant(clienteAId, (tx) =>
        tx.insert(produto).values({
          clienteId: clienteBId, // tentando gravar em nome do tenant B, autenticado como A
          sku: 'SKU-INJECAO',
          nome: 'Tentativa de vazamento entre tenants',
          categoria: 'teste',
          cmvCentavos: 1n,
          pesoGramas: 1,
        }),
      ),
    ).rejects.toThrow()
  })

  test('sem contexto de tenant setado (current_setting nulo), a leitura falha fechado — 0 linhas', async (ctx) => {
    if (!dbOk) return ctx.skip()

    // Usa o client `db` diretamente, sem passar por withTenant — nenhuma
    // variável de sessão foi setada nesta conexão/transação.
    const linhas = await db.select().from(produto).where(eq(produto.id, produtoBId))
    expect(linhas.length).toBe(0)
  })

  test.todo(
    'via rota HTTP: tenant A não lê produto do tenant B mesmo forjando a request — ' +
      'depende das Route Handlers (F4). Este teste é o par exigido pelo critério ' +
      'de aceite do M1 e deve ser implementado assim que a primeira rota de leitura existir.',
  )
})
