import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { calcularMargem } from './calcularMargem'
import type { CalcularMargemInput } from './types'
import { SKU_INF_3390 } from './__fixtures__/skus'
import {
  CATEGORIA_ELETRONICOS,
  TARIFAS_ML_ELETRONICOS,
  FRETE_BRACKETS_FICTICIOS,
  TAXA_FIXA_BRACKETS_FICTICIOS,
  ALIQUOTA_IMPOSTO_SIMPLES_BPS,
} from './__fixtures__/tarifas'

function inputComPreco(precoVendaCentavos: bigint): CalcularMargemInput {
  return {
    precoVendaCentavos,
    skuId: SKU_INF_3390.skuId,
    canalId: 'mercado_livre',
    categoria: CATEGORIA_ELETRONICOS,
    pesoGramas: 1200,
    cmvCentavos: SKU_INF_3390.cmvCentavos,
    regimeTributario: 'simples',
    aliquotaImpostoBps: ALIQUOTA_IMPOSTO_SIMPLES_BPS,
    data: new Date('2026-02-01T12:00:00Z'),
    tarifasCandidatas: TARIFAS_ML_ELETRONICOS,
    freteBrackets: FRETE_BRACKETS_FICTICIOS,
    taxaFixaBrackets: TAXA_FIXA_BRACKETS_FICTICIOS,
  }
}

describe('propriedade — precoPiso é o limite exato da margem não-negativa', () => {
  const piso = calcularMargem(inputComPreco(SKU_INF_3390.precoMlCentavos)).precoPisoCentavos

  test('para qualquer preço > precoPiso, margemLiquida > 0 (sem exceção)', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: piso + 1n, max: piso + 50_000_000n }),
        (precoVendaCentavos) => {
          const resultado = calcularMargem(inputComPreco(precoVendaCentavos))
          expect(resultado.margemLiquidaCentavos > 0n).toBe(true)
        },
      ),
      { numRuns: 500 },
    )
  })

  test('para qualquer preço <= precoPiso (e > 0), margemLiquida <= 0', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: piso }),
        (precoVendaCentavos) => {
          const resultado = calcularMargem(inputComPreco(precoVendaCentavos))
          expect(resultado.margemLiquidaCentavos <= 0n).toBe(true)
        },
      ),
      { numRuns: 500 },
    )
  })
})
