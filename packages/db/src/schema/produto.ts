import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  integer,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { cliente } from './cliente'
import { canal } from './canal'
import { tipoMovimentoEstoqueEnum } from './enums'
import { tenantIsolationPolicy } from './rls'

export const produto = pgTable(
  'produto',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    nome: text('nome').notNull(),
    categoria: text('categoria').notNull(),
    cmvCentavos: bigint('cmv_centavos', { mode: 'bigint' }).notNull(),
    pesoGramas: integer('peso_gramas').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('produto_tenant_isolation'),
    uniqueIndex('produto_cliente_sku_idx').on(table.clienteId, table.sku),
  ],
).enableRLS()

/** Estado do produto espelhado em cada canal — divergência gera reconciliação, nunca sobrescrita cega. */
export const produtoEspelho = pgTable(
  'produto_espelho',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    canalId: uuid('canal_id')
      .notNull()
      .references(() => canal.id, { onDelete: 'cascade' }),
    skuRemoto: text('sku_remoto').notNull(),
    precoRemotoCentavos: bigint('preco_remoto_centavos', { mode: 'bigint' }),
    estoqueRemoto: integer('estoque_remoto'),
    statusRemoto: text('status_remoto'),
    divergente: boolean('divergente').notNull().default(false),
    ultimaSincronizacao: timestamp('ultima_sincronizacao', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('produto_espelho_tenant_isolation'),
    uniqueIndex('produto_espelho_produto_canal_idx').on(table.produtoId, table.canalId),
  ],
).enableRLS()

export const estoque = pgTable(
  'estoque',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    quantidadeDisponivel: integer('quantidade_disponivel').notNull().default(0),
    quantidadeReservada: integer('quantidade_reservada').notNull().default(0),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('estoque_tenant_isolation'),
    uniqueIndex('estoque_produto_idx').on(table.produtoId),
  ],
).enableRLS()

export const movimentoEstoque = pgTable(
  'movimento_estoque',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    tipo: tipoMovimentoEstoqueEnum('tipo').notNull(),
    quantidade: integer('quantidade').notNull(),
    motivo: text('motivo'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('movimento_estoque_tenant_isolation')],
).enableRLS()
