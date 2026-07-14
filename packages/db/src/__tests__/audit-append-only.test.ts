import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import postgres from 'postgres'
import { verificarBancoDisponivel } from './setup'

let dbOk = false

const adminSql = postgres(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ai_commerce',
  { max: 1 },
)

let clienteId: string
let auditLogId: string

beforeAll(async () => {
  const status = await verificarBancoDisponivel()
  dbOk = status.disponivel
  if (!dbOk) {
    console.warn(
      `[audit-append-only.test.ts] pulando: ${status.motivo}. Rode "docker compose up -d && pnpm db:push" e tente de novo.`,
    )
    return
  }

  const [cliente] = await adminSql`
    insert into cliente (nome) values ('Tenant — teste audit append-only') returning id
  `
  clienteId = cliente.id

  const [log] = await adminSql`
    insert into audit_log (cliente_id, ator, acao, entidade)
    values (${clienteId}, 'teste', 'criar', 'produto')
    returning id
  `
  auditLogId = log.id
})

afterAll(async () => {
  if (dbOk) {
    // audit_log é append-only por design — nem o teste consegue limpar a linha
    // sem desligar o trigger explicitamente. Reabilita logo em seguida.
    await adminSql`alter table audit_log disable trigger audit_log_append_only`
    await adminSql`delete from cliente where id = ${clienteId}`
    await adminSql`alter table audit_log enable trigger audit_log_append_only`
  }
  await adminSql.end({ timeout: 1 }).catch(() => undefined)
})

describe('audit-append-only (M1 — critério de aceite)', () => {
  test('UPDATE em audit_log é bloqueado pelo trigger, mesmo com privilégio total', async (ctx) => {
    if (!dbOk) return ctx.skip()

    await expect(
      adminSql`update audit_log set acao = 'alterado' where id = ${auditLogId}`,
    ).rejects.toThrow(/append-only/i)
  })

  test('DELETE em audit_log é bloqueado pelo trigger, mesmo com privilégio total', async (ctx) => {
    if (!dbOk) return ctx.skip()

    await expect(
      adminSql`delete from audit_log where id = ${auditLogId}`,
    ).rejects.toThrow(/append-only/i)
  })
})
