import { describe, expect, test } from 'vitest'
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

function inputEm(data: Date): CalcularMargemInput {
  return {
    precoVendaCentavos: SKU_INF_3390.precoMlCentavos,
    skuId: SKU_INF_3390.skuId,
    canalId: 'mercado_livre',
    categoria: CATEGORIA_ELETRONICOS,
    pesoGramas: 1200,
    cmvCentavos: SKU_INF_3390.cmvCentavos,
    regimeTributario: 'simples',
    aliquotaImpostoBps: ALIQUOTA_IMPOSTO_SIMPLES_BPS,
    data,
    tarifasCandidatas: TARIFAS_ML_ELETRONICOS,
    freteBrackets: FRETE_BRACKETS_FICTICIOS,
    taxaFixaBrackets: TAXA_FIXA_BRACKETS_FICTICIOS,
  }
}

describe('regressão — versionamento de canal_tarifa (M1/M2)', () => {
  test('margem do INF-3390 no ML difere entre 2026-02-01 e 2026-04-01 (tarifa mudou de vigência)', () => {
    const emFevereiro = calcularMargem(inputEm(new Date('2026-02-01T12:00:00Z')))
    const emAbril = calcularMargem(inputEm(new Date('2026-04-01T12:00:00Z')))

    // Se isto falhar (valores iguais), o versionamento de tarifa por vigência não está
    // funcionando — a mudança de comissão entre fev (12%) e mar/abr (15%) não foi aplicada.
    expect(emFevereiro.comissao).not.toBe(emAbril.comissao)
    expect(emFevereiro.margemLiquidaCentavos).not.toBe(emAbril.margemLiquidaCentavos)

    expect(emFevereiro.comissao).toBe(5388n)
    expect(emAbril.comissao).toBe(6735n)
    expect(emFevereiro.margemLiquidaCentavos).toBe(16418n)
    expect(emAbril.margemLiquidaCentavos).toBe(15071n)
  })
})
