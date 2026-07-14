import { pgEnum } from 'drizzle-orm/pg-core'

export const papelCodigoEnum = pgEnum('papel_codigo', [
  'admin',
  'pricing',
  'atendimento',
  'auditor',
])

export const canalTipoEnum = pgEnum('canal_tipo', [
  'mercado_livre',
  'amazon',
  'shopee',
  'magalu',
  'tiktok_shop',
  'shein',
  'loja_propria',
])

export const canalStatusEnum = pgEnum('canal_status', ['ativo', 'inativo'])

export const tipoTarifaEnum = pgEnum('tipo_tarifa', ['percentual', 'fixo', 'matriz'])

export const regimeTributarioEnum = pgEnum('regime_tributario', [
  'simples',
  'lucro_presumido',
  'lucro_real',
])

export const credencialTipoEnum = pgEnum('credencial_tipo', ['oauth', 'api_key'])

export const statusPedidoEnum = pgEnum('status_pedido', [
  'novo',
  'pago',
  'enviado',
  'entregue',
  'cancelado',
])

export const tipoMovimentoEstoqueEnum = pgEnum('tipo_movimento_estoque', [
  'entrada',
  'saida',
  'ajuste',
  'reserva',
])

export const tipoAgenteEnum = pgEnum('tipo_agente', [
  'pricing',
  'estoque',
  'atendimento',
  'conteudo',
  'fraude',
])

export const statusExecucaoAgenteEnum = pgEnum('status_execucao_agente', [
  'executando',
  'concluido',
  'falhou',
])

// Máquina de estados da skill ai-decisions:
// proposed -> (auto_approved | pending_review) -> approved -> executing -> executed
//                                               -> rejected      -> failed -> (retry | dead_letter)
export const estadoDecisaoEnum = pgEnum('estado_decisao', [
  'proposed',
  'auto_approved',
  'pending_review',
  'approved',
  'rejected',
  'executing',
  'executed',
  'failed',
  'retry',
  'dead_letter',
  'rollback',
])
