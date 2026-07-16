import { pgTable, uuid, text, timestamp, bigint, pgEnum } from 'drizzle-orm/pg-core'
import { cliente, usuario } from './cliente'
import { canal } from './canal'
import { decisao } from './ia'
import { tenantIsolationPolicy } from './rls'

export const tarefaTipoEnum = pgEnum('tarefa_tipo', [
  'aprovacao_decisao', 'diagnostico_cadastro', 'divergencia_estoque', 'outro',
])
export const tarefaStatusEnum = pgEnum('tarefa_status', [
  'aberta', 'em_andamento', 'concluida', 'cancelada',
])

export const regraPreco = pgTable('regra_preco', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id').notNull().references(() => cliente.id, { onDelete: 'cascade' }),
  canalId: uuid('canal_id').references(() => canal.id, { onDelete: 'cascade' }), // null = regra global do cliente
  categoria: text('categoria'), // null = todas categorias
  margemMinimaBps: bigint('margem_minima_bps', { mode: 'bigint' }).notNull(),
  descontoMaximoBps: bigint('desconto_maximo_bps', { mode: 'bigint' }).notNull(),
  vigenteDe: timestamp('vigente_de', { withTimezone: true }).notNull(),
  vigenteAte: timestamp('vigente_ate', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, () => [tenantIsolationPolicy('regra_preco_tenant_isolation')]).enableRLS()

export const tarefa = pgTable('tarefa', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id').notNull().references(() => cliente.id, { onDelete: 'cascade' }),
  tipo: tarefaTipoEnum('tipo').notNull(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  decisaoId: uuid('decisao_id').references(() => decisao.id),
  responsavelId: uuid('responsavel_id').references(() => usuario.id),
  prazo: timestamp('prazo', { withTimezone: true }),
  status: tarefaStatusEnum('status').notNull().default('aberta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
}, () => [tenantIsolationPolicy('tarefa_tenant_isolation')]).enableRLS()
