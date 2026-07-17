import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'
import { cliente } from './cliente'
import { tenantIsolationPolicy } from './rls'

/**
 * ERPs de gestão suportados. O sistema é comercializado para clientes que podem usar ERPs
 * diferentes — 'outro' é o conector genérico (base URL + chave) para ERPs fora da lista.
 * Adicionar um ERP novo é só estender este enum + o catálogo em packages/core/integracoes.
 */
export const erpTipoEnum = pgEnum('erp_tipo', ['bling', 'tiny', 'outro'])

export const conexaoErpStatusEnum = pgEnum('conexao_erp_status', [
  'conectado',
  'desconectado',
  'erro',
])

/**
 * Conexão de um cliente (tenant) com um ERP de gestão.
 *
 * As credenciais (client_id/secret, token, api key — o que cada ERP exigir) são cifradas com
 * AES-256-GCM (packages/core/crypto) e guardadas SÓ como `payloadCifrado` + `iv` + `authTag`.
 * NUNCA em texto plano, NUNCA logadas. Mesma disciplina da tabela `credencial` (marketplaces),
 * mas separada de propósito: ERP é a fonte da verdade de catálogo/estoque, não um canal de venda.
 */
export const conexaoErp = pgTable(
  'conexao_erp',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    erp: erpTipoEnum('erp').notNull(),
    rotulo: text('rotulo').notNull(),
    status: conexaoErpStatusEnum('status').notNull().default('desconectado'),
    payloadCifrado: text('payload_cifrado').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('conexao_erp_tenant_isolation'),
    // Uma conexão por (cliente, erp): a UI lista cada ERP e conecta uma vez. Reconectar faz upsert.
    uniqueIndex('conexao_erp_cliente_erp_idx').on(table.clienteId, table.erp),
  ],
).enableRLS()

/**
 * Tokens OAuth2 de uma conexão de ERP (Bling F8). Tabela SEPARADA de `conexao_erp` de
 * propósito: `conexao_erp` guarda as credenciais estáticas de autorização (client_id/secret/code,
 * fornecidas pelo tenant); `token_oauth` guarda os tokens de sessão VOLÁTEIS (access/refresh)
 * obtidos no handshake OAuth, que rotacionam a cada refresh. Separar mantém a rotação de token
 * isolada da credencial de autorização e reduz a superfície de cada linha.
 *
 * `payloadCifrado` é o JSON `{ accessToken, refreshToken }` cifrado com AES-256-GCM
 * (packages/core/crypto) — NUNCA em texto plano, NUNCA logado. `expiraEm` é o único campo em
 * claro (não é segredo) e existe para decidir o refresh sem precisar decifrar o payload.
 */
export const tokenOauth = pgTable(
  'token_oauth',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clienteId: uuid('cliente_id')
      .notNull()
      .references(() => cliente.id, { onDelete: 'cascade' }),
    conexaoErpId: uuid('conexao_erp_id')
      .notNull()
      .references(() => conexaoErp.id, { onDelete: 'cascade' }),
    payloadCifrado: text('payload_cifrado').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    tenantIsolationPolicy('token_oauth_tenant_isolation'),
    // Um conjunto de tokens por conexão de ERP. Refresh faz upsert.
    uniqueIndex('token_oauth_conexao_idx').on(table.conexaoErpId),
  ],
).enableRLS()
