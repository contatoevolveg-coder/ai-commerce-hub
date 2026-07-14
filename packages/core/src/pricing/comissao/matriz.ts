import type { FaixaMatriz } from '../types'

export function resolverFaixaMatriz(
  matriz: FaixaMatriz[],
  pesoGramas: number,
  precoCentavos: bigint,
): FaixaMatriz | null {
  const candidatas = matriz.filter(
    (f) =>
      pesoGramas <= f.pesoMaximoGramas &&
      (f.precoMaximoCentavos === null || precoCentavos <= f.precoMaximoCentavos),
  )

  if (candidatas.length === 0) return null

  return candidatas.reduce((menor, atual) =>
    atual.pesoMaximoGramas < menor.pesoMaximoGramas ? atual : menor,
  )
}
