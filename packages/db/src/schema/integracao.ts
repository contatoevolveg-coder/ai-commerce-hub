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
