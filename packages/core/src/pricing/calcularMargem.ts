import type { CalcularMargemInput, ResultadoMargem } from './types'
import { resolverTarifaVigente, resolverFaixaFrete, resolverTaxaFixa } from './tarifa'
import { resolverComissaoStrategy } from './comissao/ComissaoStrategyRegistry'

interface Componentes {
  comissao: bigint
  taxaFixa: bigint
  frete: bigint
  imposto: bigint
}

function calcularComponentes(
  input: CalcularMargemInput,
  precoCentavos: bigint,
): Componentes {
  const tarifa = resolverTarifaVigente(
    input.tarifasCandidatas,
    input.canalId,
    input.categoria,
    input.data,
  )
  if (!tarifa) {
    throw new Error(
      `Nenhuma tarifa vigente para canal="${input.canalId}" categoria="${input.categoria}" data=${input.data.toISOString()}`,
    )
  }

  const strategy = resolverComissaoStrategy(input.canalId)
  const comissao = strategy.calcular({
    precoCentavos,
    categoria: input.categoria,
    pesoGramas: input.pesoGramas,
    tarifa,
  })

  const faixaFrete = resolverFaixaFrete(input.freteBrackets, input.pesoGramas, precoCentavos)
  const frete = faixaFrete?.valorCentavos ?? 0n

  const faixaTaxaFixa = resolverTaxaFixa(input.taxaFixaBrackets, precoCentavos)
  const taxaFixa = faixaTaxaFixa?.valorCentavos ?? 0n

  const imposto = (precoCentavos * input.aliquotaImpostoBps) / 10000n

  return { comissao, taxaFixa, frete, imposto }
}

function calcularMargemLiquidaEm(input: CalcularMargemInput, precoCentavos: bigint): bigint {
  const { comissao, taxaFixa, frete, imposto } = calcularComponentes(input, precoCentavos)
  return precoCentavos - comissao - taxaFixa - frete - imposto - input.cmvCentavos
}

/**
 * Busca binária pelo menor preço (em centavos) cuja margem líquida é >= 0.
 * Assume que margemLiquida(preco) é não-decrescente em preco dentro do intervalo de busca
 * (verdadeiro para comissão percentual/fixa/matriz e imposto percentual — as faixas de
 * frete/taxaFixa fornecidas devem ser não-crescentes com o preço, prática usual de mercado).
 */
function encontrarPrecoPiso(input: CalcularMargemInput): bigint {
  const candidatosLimite = [
    input.precoVendaCentavos * 20n,
    input.cmvCentavos * 20n,
    100_000_00n,
  ]
  const limiteSuperior = candidatosLimite.reduce((maior, atual) =>
    atual > maior ? atual : maior,
  )

  let lo = 0n
  let hi = limiteSuperior

  for (let i = 0; i < 64 && lo < hi; i++) {
    const mid = lo + (hi - lo) / 2n
    if (calcularMargemLiquidaEm(input, mid) >= 0n) {
      hi = mid
    } else {
      lo = mid + 1n
    }
  }

  return hi
}

export function calcularMargem(input: CalcularMargemInput): ResultadoMargem {
  const { comissao, taxaFixa, frete, imposto } = calcularComponentes(
    input,
    input.precoVendaCentavos,
  )

  const margemLiquidaCentavos =
    input.precoVendaCentavos - comissao - taxaFixa - frete - imposto - input.cmvCentavos

  const margemLiquidaBps =
    input.precoVendaCentavos === 0n
      ? 0n
      : (margemLiquidaCentavos * 10000n) / input.precoVendaCentavos

  const precoPisoCentavos = encontrarPrecoPiso(input)

  return {
    precoBruto: input.precoVendaCentavos,
    comissao,
    taxaFixa,
    frete,
    imposto,
    cmv: input.cmvCentavos,
    margemLiquidaCentavos,
    margemLiquidaBps,
    precoPisoCentavos,
  }
}
