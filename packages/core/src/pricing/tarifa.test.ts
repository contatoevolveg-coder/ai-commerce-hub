import { describe, expect, test } from 'vitest'
import { resolverTarifaVigente, resolverFaixaFrete, resolverTaxaFixa } from './tarifa'
import {
  CATEGORIA_ELETRONICOS,
  TARIFAS_ML_ELETRONICOS,
  TARIFA_ML_ELETRONICOS_JAN_FEV,
  TARIFA_ML_ELETRONICOS_MAR_EM_DIANTE,
  FRETE_BRACKETS_FICTICIOS,
  TAXA_FIXA_BRACKETS_FICTICIOS,
} from './__fixtures__/tarifas'

describe('resolverTarifaVigente', () => {
  test('retorna a tarifa cuja janela de vigência cobre a data', () => {
    expect(
      resolverTarifaVigente(
        TARIFAS_ML_ELETRONICOS,
        'mercado_livre',
        CATEGORIA_ELETRONICOS,
        new Date('2026-02-15T00:00:00Z'),
      ),
    ).toEqual(TARIFA_ML_ELETRONICOS_JAN_FEV)
  })

  test('retorna a tarifa sem vigente_ate (em aberto) quando a data é posterior', () => {
    expect(
      resolverTarifaVigente(
        TARIFAS_ML_ELETRONICOS,
        'mercado_livre',
        CATEGORIA_ELETRONICOS,
        new Date('2026-06-01T00:00:00Z'),
      ),
    ).toEqual(TARIFA_ML_ELETRONICOS_MAR_EM_DIANTE)
  })

  test('retorna null quando não há tarifa vigente para a data', () => {
    expect(
      resolverTarifaVigente(
        TARIFAS_ML_ELETRONICOS,
        'mercado_livre',
        CATEGORIA_ELETRONICOS,
        new Date('2025-01-01T00:00:00Z'),
      ),
    ).toBeNull()
  })

  test('retorna null quando canal ou categoria não batem', () => {
    expect(
      resolverTarifaVigente(
        TARIFAS_ML_ELETRONICOS,
        'amazon',
        CATEGORIA_ELETRONICOS,
        new Date('2026-02-15T00:00:00Z'),
      ),
    ).toBeNull()
  })

  test('na fronteira exata de vigente_ate, a tarifa antiga ainda vale (inclusive)', () => {
    expect(
      resolverTarifaVigente(
        TARIFAS_ML_ELETRONICOS,
        'mercado_livre',
        CATEGORIA_ELETRONICOS,
        new Date('2026-02-28T23:59:59Z'),
      ),
    ).toEqual(TARIFA_ML_ELETRONICOS_JAN_FEV)
  })
})

describe('resolverFaixaFrete', () => {
  test('escolhe a menor faixa de peso que comporta o peso informado', () => {
    expect(resolverFaixaFrete(FRETE_BRACKETS_FICTICIOS, 200, 5000n)?.valorCentavos).toBe(1200n)
    expect(resolverFaixaFrete(FRETE_BRACKETS_FICTICIOS, 500, 5000n)?.valorCentavos).toBe(1800n)
    expect(resolverFaixaFrete(FRETE_BRACKETS_FICTICIOS, 5000, 5000n)?.valorCentavos).toBe(3200n)
  })

  test('retorna null quando nenhuma faixa comporta o peso', () => {
    expect(resolverFaixaFrete(FRETE_BRACKETS_FICTICIOS, 999999, 5000n)).toBeNull()
  })
})

describe('resolverTaxaFixa', () => {
  test('escolhe a faixa de preço mais específica (menor teto) entre as aplicáveis', () => {
    expect(resolverTaxaFixa(TAXA_FIXA_BRACKETS_FICTICIOS, 5000n)?.valorCentavos).toBe(600n)
    expect(resolverTaxaFixa(TAXA_FIXA_BRACKETS_FICTICIOS, 7900n)?.valorCentavos).toBe(600n)
    expect(resolverTaxaFixa(TAXA_FIXA_BRACKETS_FICTICIOS, 7901n)?.valorCentavos).toBe(0n)
    expect(resolverTaxaFixa(TAXA_FIXA_BRACKETS_FICTICIOS, 100000n)?.valorCentavos).toBe(0n)
  })
})
