import type { CanalTarifaRow } from '../types'
import { resolverFaixaMatriz } from './matriz'

export interface ComissaoInput {
  precoCentavos: bigint
  categoria: string
  pesoGramas: number
  tarifa: CanalTarifaRow
}

export interface ComissaoStrategy {
  calcular(input: ComissaoInput): bigint
}

/**
 * Interpreta o `tipo` da tarifa vigente (percentual|fixo|matriz). O valor numérico
 * vem sempre de `tarifa` (resolvida por canal_tarifa/data fora do core) — nunca hardcoded.
 */
export abstract class TarifaComissaoStrategy implements ComissaoStrategy {
  calcular({ precoCentavos, pesoGramas, tarifa }: ComissaoInput): bigint {
    switch (tarifa.tipo) {
      case 'percentual': {
        const bps = tarifa.valorBps ?? 0n
        return (precoCentavos * bps) / 10000n
      }
      case 'fixo': {
        return tarifa.valorCentavos ?? 0n
      }
      case 'matriz': {
        const faixa = resolverFaixaMatriz(tarifa.matriz ?? [], pesoGramas, precoCentavos)
        return faixa?.valorCentavos ?? 0n
      }
    }
  }
}
