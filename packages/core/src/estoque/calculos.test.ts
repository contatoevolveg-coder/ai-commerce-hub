import { describe, it, expect } from 'vitest'
import {
  calcularGiro,
  calcularCoberturaEmDias,
  identificarRuptura,
  type MovimentoEstoqueSimplificado
} from './calculos'

describe('Motor de Estoque (Cálculos puros)', () => {
  const agora = new Date('2026-07-15T12:00:00Z')

  describe('calcularGiro', () => {
    it('deve calcular a quantidade total de saídas no período', () => {
      const movimentos: MovimentoEstoqueSimplificado[] = [
        { tipo: 'saida', quantidade: 5, criadoEm: new Date('2026-07-10T10:00:00Z') }, // dentro
        { tipo: 'saida', quantidade: 3, criadoEm: new Date('2026-07-01T10:00:00Z') }, // dentro
        { tipo: 'entrada', quantidade: 10, criadoEm: new Date('2026-07-12T10:00:00Z') }, // ignorado (entrada)
        { tipo: 'ajuste', quantidade: 2, criadoEm: new Date('2026-07-14T10:00:00Z') }, // ignorado (ajuste)
        { tipo: 'saida', quantidade: 4, criadoEm: new Date('2026-06-10T10:00:00Z') }, // fora do período (30 dias)
      ]

      const giro = calcularGiro(movimentos, agora, 30)
      expect(giro).toBe(8) // 5 + 3
    })

    it('deve retornar 0 se período for <= 0', () => {
      const movimentos: MovimentoEstoqueSimplificado[] = [
        { tipo: 'saida', quantidade: 5, criadoEm: agora }
      ]
      expect(calcularGiro(movimentos, agora, 0)).toBe(0)
      expect(calcularGiro(movimentos, agora, -5)).toBe(0)
    })
  })

  describe('calcularCoberturaEmDias', () => {
    it('deve calcular a cobertura corretamente baseado nas vendas', () => {
      // Vendas: 30 itens em 30 dias = 1 por dia
      // Estoque: 15 itens
      // Cobertura: 15 dias
      expect(calcularCoberturaEmDias(15, 30, 30)).toBe(15)
    })

    it('deve retornar Infinity se não houve vendas no período', () => {
      expect(calcularCoberturaEmDias(10, 0, 30)).toBe(Infinity)
    })

    it('deve retornar 0 se estoque for 0 (mesmo sem vendas)', () => {
      expect(calcularCoberturaEmDias(0, 0, 30)).toBe(0)
    })

    it('deve retornar 0 para estoque negativo', () => {
      expect(calcularCoberturaEmDias(-5, 10, 30)).toBe(0)
    })
  })

  describe('identificarRuptura', () => {
    it('deve retornar true se cobertura <= limite', () => {
      expect(identificarRuptura(10, 15)).toBe(true)
      expect(identificarRuptura(15, 15)).toBe(true)
    })

    it('deve retornar false se cobertura > limite', () => {
      expect(identificarRuptura(16, 15)).toBe(false)
      expect(identificarRuptura(Infinity, 15)).toBe(false)
    })
  })
})
