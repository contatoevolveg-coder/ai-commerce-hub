import { describe, expect, test } from 'vitest'
import { TarifaComissaoStrategy } from './ComissaoStrategy'
import {
  resolverComissaoStrategy,
  registrarComissaoStrategy,
} from './ComissaoStrategyRegistry'
import { MercadoLivreStrategy } from './strategies/MercadoLivreStrategy'
import {
  TARIFA_ML_ELETRONICOS_JAN_FEV,
  TARIFA_AMAZON_ELETRONICOS,
  TARIFA_SHOPEE_ELETRONICOS,
} from '../__fixtures__/tarifas'

class FakeStrategy extends TarifaComissaoStrategy {}

describe('ComissaoStrategyRegistry', () => {
  test('resolve a strategy correta por canalId', () => {
    expect(resolverComissaoStrategy('mercado_livre')).toBeInstanceOf(MercadoLivreStrategy)
  })

  test('lança erro para canal sem strategy registrada', () => {
    expect(() => resolverComissaoStrategy('canal_desconhecido')).toThrow(
      /Nenhuma ComissaoStrategy registrada/,
    )
  })

  test('permite registrar uma strategy nova em runtime (extensibilidade por canal)', () => {
    registrarComissaoStrategy('canal_novo', new FakeStrategy())
    expect(resolverComissaoStrategy('canal_novo')).toBeInstanceOf(FakeStrategy)
  })
})

describe('TarifaComissaoStrategy — interpretação por tipo', () => {
  const strategy = new FakeStrategy()

  test('tipo percentual: aplica valorBps sobre o preço', () => {
    const comissao = strategy.calcular({
      precoCentavos: 10000n,
      categoria: 'eletronicos',
      pesoGramas: 100,
      tarifa: TARIFA_ML_ELETRONICOS_JAN_FEV, // 12%
    })
    expect(comissao).toBe(1200n)
  })

  test('tipo fixo: retorna valorCentavos independente do preço', () => {
    const comissao = strategy.calcular({
      precoCentavos: 999999n,
      categoria: 'eletronicos',
      pesoGramas: 100,
      tarifa: TARIFA_AMAZON_ELETRONICOS,
    })
    expect(comissao).toBe(2500n)
  })

  test('tipo matriz: resolve por faixa de peso/preço', () => {
    const barato = strategy.calcular({
      precoCentavos: 5000n,
      categoria: 'eletronicos',
      pesoGramas: 300,
      tarifa: TARIFA_SHOPEE_ELETRONICOS,
    })
    expect(barato).toBe(300n)

    const pesado = strategy.calcular({
      precoCentavos: 5000n,
      categoria: 'eletronicos',
      pesoGramas: 800,
      tarifa: TARIFA_SHOPEE_ELETRONICOS,
    })
    expect(pesado).toBe(900n)
  })
})
