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

function inputBase(overrides: Partial<CalcularMargemInput> = {}): CalcularMargemInput {
  return {
    precoVendaCentavos: SKU_INF_3390.precoMlCentavos,
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
    ...overrides,
  }
}

describe('calcularMargem', () => {
  test('decompõe corretamente todos os componentes (INF-3390, ML, fev/2026)', () => {
    const resultado = calcularMargem(inputBase())

    expect(resultado.precoBruto).toBe(44900n)
    expect(resultado.comissao).toBe(5388n) // 12% de 44900
    expect(resultado.frete).toBe(3200n) // faixa 1200g -> bracket "até 100000g"
    expect(resultado.taxaFixa).toBe(0n) // preço > 7900, bracket catch-all
    expect(resultado.imposto).toBe(2694n) // 6% de 44900
    expect(resultado.cmv).toBe(17200n)
    expect(resultado.margemLiquidaCentavos).toBe(16418n)
    expect(resultado.margemLiquidaBps).toBe(3656n)
  })

  test('margemLiquidaBps é zero quando preço de venda é zero (evita divisão por zero)', () => {
    const resultado = calcularMargem(
      inputBase({ precoVendaCentavos: 0n, pesoGramas: 100 }),
    )
    expect(resultado.margemLiquidaBps).toBe(0n)
  })

  test('lança erro quando não há tarifa vigente para a data', () => {
    expect(() =>
      calcularMargem(inputBase({ data: new Date('2020-01-01T00:00:00Z') })),
    ).toThrow(/Nenhuma tarifa vigente/)
  })

  test('lança erro quando o canal não tem ComissaoStrategy registrada', () => {
    const tarifaParaCanalSemStrategy = {
      ...TARIFAS_ML_ELETRONICOS[0],
      canalId: 'canal_sem_strategy',
    }
    expect(() =>
      calcularMargem(
        inputBase({
          canalId: 'canal_sem_strategy',
          tarifasCandidatas: [tarifaParaCanalSemStrategy],
        }),
      ),
    ).toThrow(/Nenhuma ComissaoStrategy registrada/)
  })

  test('precoPisoCentavos é consistente: margem no piso é >= 0 e um centavo abaixo é < 0', () => {
    const resultado = calcularMargem(inputBase())
    const piso = resultado.precoPisoCentavos

    const noPiso = calcularMargem(inputBase({ precoVendaCentavos: piso }))
    expect(noPiso.margemLiquidaCentavos >= 0n).toBe(true)

    if (piso > 0n) {
      const abaixoDoPiso = calcularMargem(inputBase({ precoVendaCentavos: piso - 1n }))
      expect(abaixoDoPiso.margemLiquidaCentavos < 0n).toBe(true)
    }
  })

  test('precoPisoCentavos não depende do preço de venda solicitado (mesma SKU/canal/data)', () => {
    const a = calcularMargem(inputBase({ precoVendaCentavos: 44900n }))
    const b = calcularMargem(inputBase({ precoVendaCentavos: 99900n }))
    expect(a.precoPisoCentavos).toBe(b.precoPisoCentavos)
  })
})
