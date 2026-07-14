import type { CanalTarifaRow, FaixaFrete, FaixaTaxaFixa } from './types'

export function resolverTarifaVigente(
  candidatas: CanalTarifaRow[],
  canalId: string,
  categoria: string,
  data: Date,
): CanalTarifaRow | null {
  const vigentes = candidatas.filter(
    (t) =>
      t.canalId === canalId &&
      t.categoria === categoria &&
      t.vigenteDe <= data &&
      (t.vigenteAte === null || t.vigenteAte >= data),
  )

  if (vigentes.length === 0) return null

  return vigentes.reduce((maisRecente, atual) =>
    atual.vigenteDe > maisRecente.vigenteDe ? atual : maisRecente,
  )
}

export function resolverFaixaFrete(
  brackets: FaixaFrete[],
  pesoGramas: number,
  precoCentavos: bigint,
): FaixaFrete | null {
  const candidatas = brackets.filter(
    (b) =>
      pesoGramas <= b.pesoMaximoGramas &&
      (b.precoMaximoCentavos === null || precoCentavos <= b.precoMaximoCentavos),
  )

  if (candidatas.length === 0) return null

  return candidatas.reduce((menor, atual) =>
    atual.pesoMaximoGramas < menor.pesoMaximoGramas ? atual : menor,
  )
}

/** Trata `null` como teto infinito: qualquer valor finito é "menor" que null. */
function capEhMenor(a: bigint | null, b: bigint | null): boolean {
  if (a === null) return false
  if (b === null) return true
  return a < b
}

export function resolverTaxaFixa(
  brackets: FaixaTaxaFixa[],
  precoCentavos: bigint,
): FaixaTaxaFixa | null {
  const candidatas = brackets.filter(
    (b) => b.precoMaximoCentavos === null || precoCentavos <= b.precoMaximoCentavos,
  )

  if (candidatas.length === 0) return null

  return candidatas.reduce((menor, atual) =>
    capEhMenor(atual.precoMaximoCentavos, menor.precoMaximoCentavos) ? atual : menor,
  )
}
