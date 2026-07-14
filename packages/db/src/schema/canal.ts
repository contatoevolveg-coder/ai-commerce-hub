import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { cliente } from './cliente'
import { canalTipoEnum, canalStatusEnum, tipoTarifaEnum, credencialTipoEnum } from './enums'
import { tenantIsolationPolicy } from './rls'

export const canal = pgTable(
  'canal',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    tipo: canalTipoEnum('tipo').notNull(),
    nome: text('nome').notNull(),
    status: canalStatusEnum('status').notNull().default('ativo'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('canal_tenant_isolation')],
).enableRLS()

/**
 * Tarifa versionada por vigência (skill marketplace-domain). A query de resolução
 * sempre filtra: vigente_de <= $data AND (vigente_ate IS NULL OR vigente_ate >= $data).
 * O valor numérico nunca é hardcoded no código — vive só aqui (GUARDRAILS.md).
 */
export const canalTarifa = pgTable(
  'canal_tarifa',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    canalId: uuid('canal_id')
      .notNull()
      .references(() => canal.id, { onDelete: 'cascade' }),
    categoria: text('categoria').notNull(),
    tipo: tipoTarifaEnum('tipo').notNull(),
    valorBps: bigint('valor_bps', { mode: 'bigint' }),
    valorCentavos: bigint('valor_centavos', { mode: 'bigint' }),
    matriz: jsonb('matriz'),
    vigenteDe: timestamp('vigente_de', { withTimezone: true }).notNull(),
    vigenteAte: timestamp('vigente_ate', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('canal_tarifa_tenant_isolation'),
    index('canal_tarifa_lookup_idx').on(
      table.canalId,
      table.categoria,
      table.vigenteDe,
    ),
  ],
).enableRLS()

/**
 * Credencial de integração (Bling, marketplaces). `payloadCifrado` é o resultado
 * de AES-256-GCM (node:crypto) — nunca texto plano. NUNCA logar esta tabela.
 */
export const credencial = pgTable(
  'credencial',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    canalId: uuid('canal_id')
      .notNull()
      .references(() => canal.id, { onDelete: 'cascade' }),
    tipo: credencialTipoEnum('tipo').notNull(),
    payloadCifrado: text('payload_cifrado').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('credencial_tenant_isolation')],
).enableRLS()
