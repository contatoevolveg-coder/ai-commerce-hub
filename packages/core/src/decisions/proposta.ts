import { z } from 'zod'
import type { ContextoGuardrails } from './guardrails'

/**
 * Contrato da `proposta` (jsonb) de uma decisão de AJUSTE DE PREÇO.
 *
 * Dinheiro trafega como STRING de centavos (não number) para round-trip exato em jsonb:
 * bigint não é serializável em JSON, e number perde precisão acima de 2^53. O proponente
 * (agente/worker, F6/F8) calcula o preço-piso com dados REAIS (calcularMargem, com tarifa,
 * frete, imposto e CMV de verdade) e grava aqui. Na aprovação, os guardrails apenas leem e
 * enforçam — nunca recalculam o piso com valores fabricados.
 */
const centavosString = z.string().regex(/^-?\d+$/, 'Centavos deve ser um inteiro em string')

export const propostaAjustePrecoSchema = z.object({
  tipo: z.literal('ajuste_preco'),
  sku: z.string().min(1),
  precoAtualCentavos: centavosString,
  precoPropostoCentavos: centavosString,
  precoPisoCentavos: centavosString,
  precoAtacadoCentavos: centavosString.optional(),
  precoVarejoCentavos: centavosString.optional(),
})

export type PropostaAjustePreco = z.infer<typeof propostaAjustePrecoSchema>

/**
 * Deriva o contexto de guardrails de preço a partir da proposta de uma decisão.
 * Função PURA: sem I/O, sem recálculo, sem valores fabricados. Retorna `null` quando a
 * proposta não é uma decisão de preço válida (ex. diagnóstico de cadastro) — nesse caso
 * os guardrails de preço simplesmente não se aplicam.
 */
export function construirContextoGuardrails(proposta: unknown): ContextoGuardrails | null {
  const parsed = propostaAjustePrecoSchema.safeParse(proposta)
  if (!parsed.success) {
    if (typeof proposta === 'object' && proposta !== null && 'tipo' in proposta && proposta.tipo === 'ajuste_preco') {
      throw new Error('Proposta de ajuste de preço com campos inválidos — guardrails não podem ser avaliados')
    }
    return null
  }

  const p = parsed.data
  const contexto: ContextoGuardrails = {
    precoPropostoCentavos: BigInt(p.precoPropostoCentavos),
    precoPisoCentavos: BigInt(p.precoPisoCentavos),
    precoAtualCentavos: BigInt(p.precoAtualCentavos),
  }
  if (p.precoAtacadoCentavos !== undefined) {
    contexto.precoAtacadoCentavos = BigInt(p.precoAtacadoCentavos)
  }
  if (p.precoVarejoCentavos !== undefined) {
    contexto.precoVarejoCentavos = BigInt(p.precoVarejoCentavos)
  }
  return contexto
}
