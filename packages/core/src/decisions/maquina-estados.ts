import { eq, and } from 'drizzle-orm'
import { decisao, auditLog, cliente, agente, type TenantTx } from '@ai-commerce/db'
import { aplicarGuardrails, type ContextoGuardrails } from './guardrails'
import { construirContextoGuardrails } from './proposta'

export type EstadoDecisao = typeof decisao.$inferSelect.estado

// Reexport para consumidores que já importavam o tipo daqui.
export type { ContextoGuardrails } from './guardrails'

// Grafo de transições válidas (skill ai-decisions).
const TRANSICOES_VALIDAS: Record<EstadoDecisao, EstadoDecisao[]> = {
  proposed: ['auto_approved', 'pending_review'],
  auto_approved: ['executing'],
  pending_review: ['approved', 'rejected'],
  approved: ['executing'],
  executing: ['executed', 'failed'],
  executed: ['rollback'],
  failed: ['retry', 'dead_letter'],
  rejected: [],
  retry: ['executing'],
  dead_letter: [],
  rollback: [],
}

export function validarTransicaoEstado(estadoAtual: EstadoDecisao, estadoAlvo: EstadoDecisao): void {
  const permitidos = TRANSICOES_VALIDAS[estadoAtual] || []
  if (!permitidos.includes(estadoAlvo)) {
    throw new Error(`Transição inválida de '${estadoAtual}' para '${estadoAlvo}'.`)
  }
}

/**
 * Transita o estado de uma decisão validando o grafo da máquina de estados e executando
 * os guardrails. DEVE ser chamado dentro de uma transação (withTenant).
 *
 * O contexto de preço para os hard stops é derivado da PRÓPRIA decisão (`decisaoAtual.proposta`),
 * nunca recalculado aqui com valores fabricados. Kill switch e nível de autonomia são lookups
 * simples de coluna única no banco. Um `contexto` explícito (usado em testes) tem precedência.
 */
async function comporContexto(
  tx: TenantTx,
  decisaoAtual: typeof decisao.$inferSelect,
  contexto?: ContextoGuardrails
): Promise<ContextoGuardrails> {
  const contextoPreco = construirContextoGuardrails(decisaoAtual.proposta)
  const contextoResolvido: ContextoGuardrails = { ...contextoPreco, ...contexto }

  if (contextoResolvido.cliente === undefined) {
    const [c] = await tx
      .select({ aiExecutionEnabled: cliente.aiExecutionEnabled })
      .from(cliente)
      .where(eq(cliente.id, decisaoAtual.clienteId))
    if (c) contextoResolvido.cliente = c
  }
  if (contextoResolvido.agente === undefined) {
    const [a] = await tx
      .select({ nivelAutonomia: agente.nivelAutonomia })
      .from(agente)
      .where(eq(agente.id, decisaoAtual.agenteId))
    if (a) contextoResolvido.agente = a
  }
  return contextoResolvido
}

async function gerarRollback(
  tx: TenantTx,
  decisaoAtual: typeof decisao.$inferSelect,
  ator: string,
  motivo?: string
) {
  if (decisaoAtual.estado !== 'executed') {
    throw new Error('Apenas decisões executadas podem sofrer rollback.')
  }

  const [novaDecisao] = await tx
    .insert(decisao)
    .values({
      clienteId: decisaoAtual.clienteId,
      agenteId: decisaoAtual.agenteId,
      versaoPrompt: decisaoAtual.versaoPrompt,
      modelo: decisaoAtual.modelo,
      inputHash: decisaoAtual.inputHash,
      proposta: decisaoAtual.estadoAnteriorJson ?? {}, // rollback usa o estado anterior
      raciocinio: `Rollback da decisão ${decisaoAtual.id}${motivo ? `: ${motivo}` : ''}`,
      impactoEstimadoCentavos: -decisaoAtual.impactoEstimadoCentavos,
      confianca: 100,
      estado: 'proposed',
      estadoAnteriorJson: decisaoAtual.proposta,
    })
    .returning()

  const [decisaoAtualizada] = await tx
    .update(decisao)
    .set({ estado: 'rollback', atualizadoEm: new Date() })
    .where(and(eq(decisao.id, decisaoAtual.id), eq(decisao.clienteId, decisaoAtual.clienteId)))
    .returning()

  await tx.insert(auditLog).values({
    clienteId: decisaoAtual.clienteId,
    ator,
    acao: 'transicao_estado_decisao',
    entidade: 'decisao',
    entidadeId: decisaoAtual.id,
    valorAnterior: { estado: decisaoAtual.estado },
    valorNovo: { estado: 'rollback', rollbackDecisaoId: novaDecisao.id },
    motivo: motivo ?? 'Rollback',
  })

  return decisaoAtualizada
}

export async function transitarDecisao(
  tx: TenantTx,
  decisaoAtual: typeof decisao.$inferSelect,
  estadoAlvo: EstadoDecisao,
  ator: string,
  motivo?: string,
  contexto?: ContextoGuardrails,
): Promise<typeof decisao.$inferSelect> {
  // 1. Valida o grafo da máquina de estados
  validarTransicaoEstado(decisaoAtual.estado, estadoAlvo)

  // 2. Resolve o contexto e aplica guardrails
  if (estadoAlvo === 'auto_approved' || estadoAlvo === 'approved') {
    const contextoResolvido = await comporContexto(tx, decisaoAtual, contexto)
    aplicarGuardrails(estadoAlvo, decisaoAtual.impactoEstimadoCentavos, contextoResolvido)
  }

  // 3. Rollback
  if (estadoAlvo === 'rollback') {
    return gerarRollback(tx, decisaoAtual, ator, motivo)
  }

  // 4. Fluxo normal: atualiza o estado
  const registrarAtor = ator !== 'sistema' && (estadoAlvo === 'approved' || estadoAlvo === 'rejected')
  const [decisaoAtualizada] = await tx
    .update(decisao)
    .set(
      registrarAtor
        ? { estado: estadoAlvo, atualizadoEm: new Date(), atorAprovador: ator }
        : { estado: estadoAlvo, atualizadoEm: new Date() },
    )
    .where(and(eq(decisao.id, decisaoAtual.id), eq(decisao.clienteId, decisaoAtual.clienteId)))
    .returning()

  // 5. Trilha de auditoria
  await tx.insert(auditLog).values({
    clienteId: decisaoAtual.clienteId,
    ator,
    acao: 'transicao_estado_decisao',
    entidade: 'decisao',
    entidadeId: decisaoAtual.id,
    valorAnterior: { estado: decisaoAtual.estado },
    valorNovo: { estado: estadoAlvo },
    motivo: motivo ?? `Transição para ${estadoAlvo}`,
  })

  return decisaoAtualizada
}
