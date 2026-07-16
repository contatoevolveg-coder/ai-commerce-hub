import { eq } from 'drizzle-orm'
import { db, decisao, agente } from '@ai-commerce/db'

export async function registrarDecisao(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: {
    clienteId: string
    agenteNome: string // Ex: 'Diagnóstico SEO'
    versaoPrompt: string
    modelo: string
    inputHash: string
    proposta: Record<string, unknown>
    raciocinio: string
    impactoEstimadoCentavos: bigint
    confianca: number
    tokensIn: number
    tokensOut: number
  }
) {
  // 1. Acha o ID do agente (ou cria um mock/sistema pra ele se não tiver)
  let [agenteRecord] = await tx
    .select()
    .from(agente)
    .where(eq(agente.nome, params.agenteNome))

  if (!agenteRecord) {
    [agenteRecord] = await tx
      .insert(agente)
      .values({
        clienteId: params.clienteId,
        nome: params.agenteNome,
        tipo: 'conteudo',
        nivelAutonomia: 1,
        versaoPrompt: params.versaoPrompt,
      })
      .returning()
  }

  // 2. Calcula custo aproximado (ex: gpt-4o-mini é $0.15/1M in, $0.60/1M out)
  // Convertendo para centavos de Real (BRL) - aproximação simples
  const custoIn = (params.tokensIn / 1000000) * 0.15 * 550 // 5.5 BRL rate
  const custoOut = (params.tokensOut / 1000000) * 0.60 * 550
  const custoTotalCentavos = BigInt(Math.ceil(custoIn + custoOut))

  // 3. Define estado baseado na confiança e autonomia
  // Como nível é 1, sempre 'proposed'
  const estado = 'proposed'

  // 4. Insere a Decisão
  const [novaDecisao] = await tx
    .insert(decisao)
    .values({
      clienteId: params.clienteId,
      agenteId: agenteRecord.id,
      versaoPrompt: params.versaoPrompt,
      modelo: params.modelo,
      inputHash: params.inputHash,
      proposta: params.proposta,
      raciocinio: params.raciocinio,
      impactoEstimadoCentavos: params.impactoEstimadoCentavos,
      confianca: params.confianca,
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
      custoCentavos: custoTotalCentavos,
      estado,
    })
    .returning()

  return novaDecisao
}
