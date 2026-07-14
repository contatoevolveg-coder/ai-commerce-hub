import { pgTable, uuid, text, timestamp, bigint, integer } from 'drizzle-orm/pg-core'
import { cliente } from './cliente'
import { canal } from './canal'
import { produto } from './produto'
import { statusPedidoEnum } from './enums'
import { tenantIsolationPolicy } from './rls'

export const comprador = pgTable(
  'comprador',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    email: text('email'),
    documento: text('documento'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('comprador_tenant_isolation')],
).enableRLS()

export const pedido = pgTable(
  'pedido',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    canalId: uuid('canal_id')
      .notNull()
      .references(() => canal.id, { onDelete: 'cascade' }),
    compradorId: uuid('comprador_id').references(() => comprador.id),
    numeroPedidoRemoto: text('numero_pedido_remoto').notNull(),
    status: statusPedidoEnum('status').notNull().default('novo'),
    totalCentavos: bigint('total_centavos', { mode: 'bigint' }).notNull(),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('pedido_tenant_isolation')],
).enableRLS()

export const itemPedido = pgTable(
  'item_pedido',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    pedidoId: uuid('pedido_id')
      .notNull()
      .references(() => pedido.id, { onDelete: 'cascade' }),
    produtoId: uuid('produto_id')
      .notNull()
      .references(() => produto.id),
    quantidade: integer('quantidade').notNull(),
    precoUnitarioCentavos: bigint('preco_unitario_centavos', { mode: 'bigint' }).notNull(),
  },
  () => [tenantIsolationPolicy('item_pedido_tenant_isolation')],
).enableRLS()
