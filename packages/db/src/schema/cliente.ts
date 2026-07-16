import { pgTable, uuid, text, timestamp, uniqueIndex, boolean } from 'drizzle-orm/pg-core'
import { regimeTributarioEnum, papelCodigoEnum } from './enums'
import { selfTenantIsolationPolicy, tenantIsolationPolicy } from './rls'

/**
 * cliente = tenant. Cada seller/empresa que usa a plataforma é um `cliente`.
 * Nunca renomeie para organization/tenant/org — a nomenclatura é fixa (AGENTS.md).
 */
export const cliente = pgTable(
  'cliente',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    nome: text('nome').notNull(),
    cnpj: text('cnpj'),
    regimeTributario: regimeTributarioEnum('regime_tributario').notNull().default('simples'),
    aiExecutionEnabled: boolean('ai_execution_enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [selfTenantIsolationPolicy('cliente_self_isolation')],
).enableRLS()

/**
 * Papel é referência global fixa do sistema (admin|pricing|atendimento|auditor),
 * não é dado de negócio por tenant — por isso não tem cliente_id nem RLS.
 */
export const papel = pgTable('papel', {
  id: uuid('id').defaultRandom().primaryKey(),
  codigo: papelCodigoEnum('codigo').notNull().unique(),
  descricao: text('descricao').notNull(),
})

export const usuario = pgTable(
  'usuario',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    papelId: uuid('papel_id')
      .notNull()
      .references(() => papel.id),
    nome: text('nome').notNull(),
    email: text('email').notNull(),
    senhaHash: text('senha_hash').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('usuario_tenant_isolation'),
    uniqueIndex('usuario_cliente_email_idx').on(table.clienteId, table.email),
  ],
).enableRLS()

/**
 * Registro de sessão a nível de domínio (last login / auditoria). A gestão real
 * de sessão HTTP/cookies fica a cargo do Auth.js quando a F5 conectar o provider —
 * esta tabela não substitui isso, só rastreia o evento de login para audit_log.
 */
export const sessao = pgTable(
  'sessao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, { onDelete: 'cascade' }),
    ip: text('ip'),
    userAgent: text('user_agent'),
    criadaEm: timestamp('criada_em', { withTimezone: true }).defaultNow().notNull(),
    expiraEm: timestamp('expira_em', { withTimezone: true }),
  },
  () => [tenantIsolationPolicy('sessao_tenant_isolation')],
).enableRLS()
