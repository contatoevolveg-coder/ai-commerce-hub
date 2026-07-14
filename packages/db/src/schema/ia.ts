import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  text,
  timestamp,
  bigint,
  integer,
  smallint,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
import { cliente, usuario } from './cliente'
import { tipoAgenteEnum, statusExecucaoAgenteEnum, estadoDecisaoEnum } from './enums'
import { tenantIsolationPolicy } from './rls'

export const agente = pgTable(
  'agente',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    tipo: tipoAgenteEnum('tipo').notNull(),
    nivelAutonomia: smallint('nivel_autonomia').notNull().default(1),
    versaoPrompt: text('versao_prompt').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('agente_tenant_isolation')],
).enableRLS()

export const execucaoAgente = pgTable(
  'execucao_agente',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    agenteId: uuid('agente_id')
      .notNull()
      .references(() => agente.id, { onDelete: 'cascade' }),
    status: statusExecucaoAgenteEnum('status').notNull().default('executando'),
    contexto: jsonb('contexto'),
    iniciadoEm: timestamp('iniciado_em', { withTimezone: true }).defaultNow().notNull(),
    finalizadoEm: timestamp('finalizado_em', { withTimezone: true }),
  },
  () => [tenantIsolationPolicy('execucao_agente_tenant_isolation')],
).enableRLS()

/**
 * Toda ação de IA é uma Decisao (AGENTS.md regra 5). Nada é executado sem passar
 * pela máquina de estados da skill ai-decisions. Ver skill para os guardrails
 * hard-stop (preço-piso, variação >15%/24h, kill switch).
 */
export const decisao = pgTable(
  'decisao',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    agenteId: uuid('agente_id')
      .notNull()
      .references(() => agente.id, { onDelete: 'cascade' }),
    execucaoId: uuid('execucao_id').references(() => execucaoAgente.id),
    versaoPrompt: text('versao_prompt').notNull(),
    modelo: text('modelo').notNull(),
    inputHash: text('input_hash').notNull(),
    proposta: jsonb('proposta').notNull(),
    raciocinio: text('raciocinio').notNull(),
    impactoEstimadoCentavos: bigint('impacto_estimado_centavos', { mode: 'bigint' }).notNull(),
    confianca: smallint('confianca').notNull(),
    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    custoCentavos: bigint('custo_centavos', { mode: 'bigint' }).notNull().default(sql`0`),
    estado: estadoDecisaoEnum('estado').notNull().default('proposed'),
    atorAprovador: uuid('ator_aprovador').references(() => usuario.id),
    estadoAnteriorJson: jsonb('estado_anterior_json'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('decisao_tenant_isolation')],
).enableRLS()

/**
 * Append-only por design (AGENTS.md regra 6). O bloqueio de UPDATE/DELETE é
 * reforçado por trigger no banco (migration customizada), não só na aplicação.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    ator: text('ator').notNull(),
    acao: text('acao').notNull(),
    entidade: text('entidade').notNull(),
    entidadeId: text('entidade_id'),
    valorAnterior: jsonb('valor_anterior'),
    valorNovo: jsonb('valor_novo'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    motivo: text('motivo'),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('audit_log_tenant_isolation')],
).enableRLS()

/** Consumo de LLM agregado por agente/mês (skill ai-decisions: alerta em 80%, nível 1 em 100%). */
export const consumoIa = pgTable(
  'consumo_ia',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    agenteId: uuid('agente_id').references(() => agente.id),
    mesReferencia: text('mes_referencia').notNull(),
    tokensIn: bigint('tokens_in', { mode: 'bigint' }).notNull().default(sql`0`),
    tokensOut: bigint('tokens_out', { mode: 'bigint' }).notNull().default(sql`0`),
    custoCentavos: bigint('custo_centavos', { mode: 'bigint' }).notNull().default(sql`0`),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  () => [tenantIsolationPolicy('consumo_ia_tenant_isolation')],
).enableRLS()
