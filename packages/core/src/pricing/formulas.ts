export function calcularMarkupBps(precoCentavos: bigint, cmvCentavos: bigint): bigint {
  if (cmvCentavos === 0n) {
    throw new Error('cmvCentavos não pode ser zero para calcular markup')
  }
  return (precoCentavos * 10000n) / cmvCentavos
}

export function calcularBreakEvenUnidades(
  custoFixoCentavos: bigint,
  precoCentavos: bigint,
  custoVariavelUnitarioCentavos: bigint,
): bigint {
  const margemContribuicao = precoCentavos - custoVariavelUnitarioCentavos
  if (margemContribuicao <= 0n) {
    throw new Error('Preço deve ser maior que o custo variável unitário para haver break-even')
  }
  return (custoFixoCentavos + margemContribuicao - 1n) / margemContribuicao
}

export function calcularRoiBps(
  lucroLiquidoCentavos: bigint,
  custoTotalInvestidoCentavos: bigint,
): bigint {
  if (custoTotalInvestidoCentavos === 0n) {
    throw new Error('custoTotalInvestidoCentavos não pode ser zero para calcular ROI')
  }
  return (lucroLiquidoCentavos * 10000n) / custoTotalInvestidoCentavos
}
