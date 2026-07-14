import { describe, expect, test } from 'vitest'
import { calcularMarkupBps, calcularBreakEvenUnidades, calcularRoiBps } from './formulas'

describe('calcularMarkupBps', () => {
  test('preço 2x o custo = markup de 200% (20000 bps)', () => {
    expect(calcularMarkupBps(20000n, 10000n)).toBe(20000n)
  })

  test('lança erro quando cmv é zero', () => {
    expect(() => calcularMarkupBps(1000n, 0n)).toThrow(/cmvCentavos não pode ser zero/)
  })
})

describe('calcularBreakEvenUnidades', () => {
  test('arredonda para cima (não é possível vender fração de unidade)', () => {
    // custoFixo=10000, margemContribuicao=(3000-1000)=2000 -> 5 unidades exatas
    expect(calcularBreakEvenUnidades(10000n, 3000n, 1000n)).toBe(5n)
    // custoFixo=10001 -> 10001/2000 = 5.0005 -> arredonda para 6
    expect(calcularBreakEvenUnidades(10001n, 3000n, 1000n)).toBe(6n)
  })

  test('lança erro quando preço <= custo variável unitário (sem break-even possível)', () => {
    expect(() => calcularBreakEvenUnidades(10000n, 1000n, 1000n)).toThrow(
      /custo variável unitário/i,
    )
  })
})

describe('calcularRoiBps', () => {
  test('lucro igual ao investimento = ROI de 100% (10000 bps)', () => {
    expect(calcularRoiBps(5000n, 5000n)).toBe(10000n)
  })

  test('lança erro quando o investimento total é zero', () => {
    expect(() => calcularRoiBps(100n, 0n)).toThrow(/custoTotalInvestidoCentavos não pode ser zero/)
  })
})
