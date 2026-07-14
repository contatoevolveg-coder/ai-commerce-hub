import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import { cliente, usuario } from './cliente'
import { tenantIsolationPolicy } from './rls'

export const notificacao = pgTable(
  'notificacao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    usuarioId: uuid('usuario_id').references(() => usuario.id, { onDelete: 'cascade' }),
    tipo: text('tipo').notNull(),
    titulo: text('titulo').notNull(),
    mensagem: text('mensagem').notNull(),
    lida: boolean('lida').notNull().default(false),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('notificacao_tenant_isolation')],
).enableRLS()

export const automacao = pgTable(
  'automacao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    gatilho: text('gatilho').notNull(),
    condicoes: jsonb('condicoes'),
    acoes: jsonb('acoes'),
    ativo: boolean('ativo').notNull().default(true),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('automacao_tenant_isolation')],
).enableRLS()
