export class HardStopError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HardStopError'
  }
}

export class PendingReviewRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PendingReviewRequiredError'
  }
}

/**
 * Contexto usado pelos guardrails. Todos os campos de preço são bigint em centavos.
 * O contexto de preço é derivado da PRÓPRIA decisão (ver proposta.ts) — quem propõe a
 * decisão é responsável por calcular o preço-piso com dados reais (calcularMargem) e
 * gravá-lo na proposta. Os guardrails aqui apenas ENFORÇAM, nunca recalculam com valores
 * fabricados (isso daria falsa confiança — um piso inventado é pior que nenhum piso).
 */
export interface ContextoGuardrails {
  cliente?: { aiExecutionEnabled: boolean }
  agente?: { nivelAutonomia: number }
  precoPropostoCentavos?: bigint
  precoPisoCentavos?: bigint
  precoAtacadoCentavos?: bigint
  precoVarejoCentavos?: bigint
  precoAtualCentavos?: bigint
}

/**
 * Hard stop: Preço sugerido não pode ser menor que o preço-piso.
 */
export function verificarPrecoPiso(precoPropostoCentavos: bigint, precoPisoCentavos: bigint): void {
  if (precoPropostoCentavos < precoPisoCentavos) {
    throw new HardStopError(`Preço proposto (${precoPropostoCentavos}) é menor que o preço-piso (${precoPisoCentavos}).`)
  }
}

/**
 * Hard stop: Preço atacado não pode ser maior que 97% do preço varejo.
 */
export function verificarAtacadoVarejo(precoAtacadoCentavos: bigint, precoVarejoCentavos: bigint): void {
  const maxAtacado = (precoVarejoCentavos * 97n) / 100n
  if (precoAtacadoCentavos > maxAtacado) {
    throw new HardStopError(`Preço atacado (${precoAtacadoCentavos}) excede 97% do preço varejo (${maxAtacado}).`)
  }
}

/**
 * Hard stop global: Kill switch da inteligência artificial.
 */
export function verificarKillSwitch(aiExecutionEnabled: boolean): void {
  if (!aiExecutionEnabled) {
    throw new HardStopError('Execução de IA está desabilitada para este cliente (Kill Switch ativado).')
  }
}

/**
 * Soft stop: Variação de preço > 15% em 24h força pending_review.
 *
 * Cálculo em basis points (1500 bps = 15%), não em percentual inteiro (AGENTS.md regra 8):
 * uma variação real de 15,5% (ex. R$100,00 → R$115,50) precisa disparar. Dividir por 100
 * (percentual inteiro) truncaria 15,5 para 15 e deixaria passar — por isso usamos bps.
 */
export function verificarVariacaoAbrupta(precoAtualCentavos: bigint, precoPropostoCentavos: bigint): void {
  if (precoAtualCentavos === 0n) return // Evita divisão por zero se não houver preço anterior

  const diff = precoPropostoCentavos - precoAtualCentavos
  const absDiff = diff < 0n ? -diff : diff

  const variacaoBps = (absDiff * 10000n) / precoAtualCentavos // 10000 bps = 100%

  if (variacaoBps > 1500n) {
    throw new PendingReviewRequiredError(`Variação de preço excede 15% (foi de ${precoAtualCentavos} para ${precoPropostoCentavos}).`)
  }
}

/**
 * Soft stop: Limite de impacto financeiro por nível de autonomia.
 */
export function verificarLimiteAutonomia(nivelAutonomia: number, impactoEstimadoCentavos: bigint): void {
  // Impacto é em valor absoluto (tanto perda quanto ganho além do limite exigem revisão)
  const absImpacto = impactoEstimadoCentavos < 0n ? -impactoEstimadoCentavos : impactoEstimadoCentavos

  switch (nivelAutonomia) {
    case 1:
      throw new PendingReviewRequiredError('Nível de autonomia 1 apenas sugere (sempre exige revisão).')
    case 2:
      if (absImpacto > 100_00n) { // R$ 100
        throw new PendingReviewRequiredError(`Impacto de ${absImpacto} excede limite de R$ 100 do nível 2.`)
      }
      break
    case 3:
      if (absImpacto > 500_00n) { // R$ 500
        throw new PendingReviewRequiredError(`Impacto de ${absImpacto} excede limite de R$ 500 do nível 3.`)
      }
      break
    case 4:
      if (absImpacto > 2000_00n) { // R$ 2.000
        throw new PendingReviewRequiredError(`Impacto de ${absImpacto} excede limite de R$ 2.000 do nível 4.`)
      }
      break
    case 5:
      // Nível 5 não tem limite financeiro (sujeito apenas aos hard stops testados à parte)
      break
    default:
      throw new PendingReviewRequiredError(`Nível de autonomia inválido ou desconhecido: ${nivelAutonomia}.`)
  }
}

/**
 * Aplica todos os guardrails para uma transição de aprovação.
 *
 * - Hard stops (preço-piso, atacado/varejo, kill switch): bloqueiam TANTO o fluxo autônomo
 *   (auto_approved) QUANTO a aprovação humana manual (approved). Ninguém — nem um admin —
 *   consegue empurrar um preço abaixo do piso.
 * - Soft stops (limite de autonomia, variação abrupta): só se aplicam ao fluxo autônomo
 *   (auto_approved), forçando a decisão a passar por revisão humana (pending_review).
 *   Na aprovação humana (approved) o humano JÁ está revisando, então não se aplicam.
 *
 * Cada verificação só roda se o dado necessário estiver no contexto. Se um preço-piso não
 * pôde ser derivado da decisão, a verificação de piso não roda — por isso a proposta de uma
 * decisão de preço DEVE carregar o piso (ver proposta.ts); é responsabilidade do proponente.
 */
export function aplicarGuardrails(
  estadoAlvo: 'auto_approved' | 'approved' | string,
  impactoEstimadoCentavos: bigint,
  contexto?: ContextoGuardrails,
): void {
  if (estadoAlvo !== 'auto_approved' && estadoAlvo !== 'approved') {
    return
  }

  // 1. HARD STOPS (autônomo E manual)
  if (contexto?.cliente?.aiExecutionEnabled !== undefined) {
    verificarKillSwitch(contexto.cliente.aiExecutionEnabled)
  }
  if (contexto?.precoPropostoCentavos !== undefined && contexto?.precoPisoCentavos !== undefined) {
    verificarPrecoPiso(contexto.precoPropostoCentavos, contexto.precoPisoCentavos)
  }
  if (contexto?.precoAtacadoCentavos !== undefined && contexto?.precoVarejoCentavos !== undefined) {
    verificarAtacadoVarejo(contexto.precoAtacadoCentavos, contexto.precoVarejoCentavos)
  }

  // 2. SOFT STOPS (só no fluxo autônomo)
  if (estadoAlvo === 'auto_approved') {
    if (contexto?.agente?.nivelAutonomia !== undefined) {
      verificarLimiteAutonomia(contexto.agente.nivelAutonomia, impactoEstimadoCentavos)
    }
    if (contexto?.precoAtualCentavos !== undefined && contexto?.precoPropostoCentavos !== undefined) {
      verificarVariacaoAbrupta(contexto.precoAtualCentavos, contexto.precoPropostoCentavos)
    }
  }
}
