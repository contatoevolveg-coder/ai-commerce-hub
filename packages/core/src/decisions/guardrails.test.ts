import { describe, it, expect } from 'vitest'
import { decisao, type TenantTx } from '@ai-commerce/db'
import {
  HardStopError,
  PendingReviewRequiredError,
  aplicarGuardrails,
  verificarPrecoPiso,
  verificarAtacadoVarejo,
  verificarKillSwitch,
  verificarVariacaoAbrupta,
  verificarLimiteAutonomia,
} from './guardrails'
import { construirContextoGuardrails } from './proposta'
import { transitarDecisao } from './maquina-estados'

describe('Guardrails Puros', () => {
  describe('verificarPrecoPiso', () => {
    it('deve passar se preço proposto for >= preço piso', () => {
      expect(() => verificarPrecoPiso(100_00n, 90_00n)).not.toThrow()
      expect(() => verificarPrecoPiso(100_00n, 100_00n)).not.toThrow()
    })
    it('deve bloquear (Hard Stop) se preço proposto for < preço piso', () => {
      expect(() => verificarPrecoPiso(89_99n, 90_00n)).toThrow(HardStopError)
    })
  })

  describe('verificarAtacadoVarejo', () => {
    it('deve passar se preço atacado for <= 97% do preço varejo', () => {
      expect(() => verificarAtacadoVarejo(97_00n, 100_00n)).not.toThrow()
      expect(() => verificarAtacadoVarejo(90_00n, 100_00n)).not.toThrow()
    })
    it('deve bloquear (Hard Stop) se preço atacado for > 97% do preço varejo', () => {
      expect(() => verificarAtacadoVarejo(98_00n, 100_00n)).toThrow(HardStopError)
    })
  })

  describe('verificarKillSwitch', () => {
    it('deve passar se aiExecutionEnabled for true', () => {
      expect(() => verificarKillSwitch(true)).not.toThrow()
    })
    it('deve bloquear (Hard Stop) se aiExecutionEnabled for false', () => {
      expect(() => verificarKillSwitch(false)).toThrow(HardStopError)
    })
  })

  describe('verificarVariacaoAbrupta', () => {
    it('deve passar se variação for <= 15%', () => {
      expect(() => verificarVariacaoAbrupta(100_00n, 115_00n)).not.toThrow()
      expect(() => verificarVariacaoAbrupta(100_00n, 85_00n)).not.toThrow()
    })
    it('deve forçar pending_review (Soft Stop) se variação for > 15%', () => {
      expect(() => verificarVariacaoAbrupta(100_00n, 116_00n)).toThrow(PendingReviewRequiredError)
      expect(() => verificarVariacaoAbrupta(100_00n, 84_00n)).toThrow(PendingReviewRequiredError)
    })
    it('deve pegar variação fracionária (15,5%) que o cálculo em % inteiro deixaria passar', () => {
      // R$100,00 -> R$115,50 = 15,5% (> 15%). Em % inteiro truncaria para 15 e passaria.
      expect(() => verificarVariacaoAbrupta(100_00n, 115_50n)).toThrow(PendingReviewRequiredError)
    })
  })

  describe('verificarLimiteAutonomia', () => {
    it('deve forçar pending_review para nível 1 sempre', () => {
      expect(() => verificarLimiteAutonomia(1, 10_00n)).toThrow(PendingReviewRequiredError)
    })
    it('deve passar para nível 2 se impacto <= 100 BRL', () => {
      expect(() => verificarLimiteAutonomia(2, 100_00n)).not.toThrow()
      expect(() => verificarLimiteAutonomia(2, -100_00n)).not.toThrow()
    })
    it('deve forçar pending_review para nível 2 se impacto > 100 BRL', () => {
      expect(() => verificarLimiteAutonomia(2, 100_01n)).toThrow(PendingReviewRequiredError)
      expect(() => verificarLimiteAutonomia(2, -100_01n)).toThrow(PendingReviewRequiredError)
    })
    it('deve passar para nível 5 sem limite', () => {
      expect(() => verificarLimiteAutonomia(5, 999999_00n)).not.toThrow()
    })
  })
})

describe('construirContextoGuardrails (proposta -> contexto, puro)', () => {
  it('extrai o contexto de preço de uma proposta de ajuste_preco válida', () => {
    const ctx = construirContextoGuardrails({
      tipo: 'ajuste_preco',
      sku: 'INF-1042',
      precoAtualCentavos: '18990',
      precoPropostoCentavos: '19500',
      precoPisoCentavos: '12000',
    })
    expect(ctx?.precoPropostoCentavos).toBe(19500n)
    expect(ctx?.precoPisoCentavos).toBe(12000n)
    expect(ctx?.precoAtualCentavos).toBe(18990n)
  })

  it('retorna null quando a proposta não é uma decisão de preço', () => {
    expect(construirContextoGuardrails({ tipo: 'diagnostico_cadastro' })).toBeNull()
    expect(construirContextoGuardrails(null)).toBeNull()
  })

  it('lança erro (fail-closed) quando é uma decisão de preço com campos inválidos', () => {
    // Fail-closed intencional: uma proposta de ajuste_preco malformada NUNCA deve pular
    // os guardrails silenciosamente (essa era a reintrodução do bug original). Ver
    // ANTIGRAVITY_RULES.md / HISTORICO_PROJETO.md — auditoria pós-F5.3.
    expect(() => construirContextoGuardrails({ tipo: 'ajuste_preco', sku: 'X' })).toThrow(
      'Proposta de ajuste de preço com campos inválidos',
    )
  })
})

describe('Composição real: guardrails derivados da proposta bloqueiam a aprovação', () => {
  // Este é o teste que prova o caminho REAL: o mesmo par de funções que `transitarDecisao`
  // usa internamente (derivar contexto da proposta -> aplicar guardrails no alvo 'approved').
  it('bloqueia uma aprovação humana (approved) cuja proposta viola o preço-piso', () => {
    const ctx = construirContextoGuardrails({
      tipo: 'ajuste_preco',
      sku: 'INF-1042',
      precoAtualCentavos: '10000',
      precoPropostoCentavos: '8000',
      precoPisoCentavos: '10000',
    })
    expect(() => aplicarGuardrails('approved', 0n, ctx ?? undefined)).toThrow(HardStopError)
  })

  it('permite uma aprovação humana (approved) cuja proposta respeita o preço-piso', () => {
    const ctx = construirContextoGuardrails({
      tipo: 'ajuste_preco',
      sku: 'INF-1042',
      precoAtualCentavos: '10000',
      precoPropostoCentavos: '15000',
      precoPisoCentavos: '10000',
    })
    expect(() => aplicarGuardrails('approved', 0n, ctx ?? undefined)).not.toThrow()
  })
})

/**
 * Mock mínimo de transação: um objeto encadeável cujo `where()` é awaitable (retorna [row])
 * e também expõe `.returning()`. Serve tanto para `await select().from().where()` quanto
 * para `update().set().where().returning()`. Sem `any`.
 */
function criarMockTx(row: Record<string, unknown>): TenantTx {
  const thenableComReturning = {
    then: (resolve: (v: unknown) => unknown) => resolve([row]),
    returning: () => Promise.resolve([row]),
  }
  const chain: Record<string, () => unknown> = {
    select: () => chain,
    from: () => chain,
    where: () => thenableComReturning,
    update: () => chain,
    set: () => chain,
    insert: () => chain,
    values: () => Promise.resolve([row]),
  }
  return chain as unknown as TenantTx
}

describe('transitarDecisao (fiação: deriva contexto da decisão sem contexto explícito)', () => {
  const decisaoBase = {
    id: 'd1',
    clienteId: 'c1',
    agenteId: 'a1',
    estado: 'pending_review',
    impactoEstimadoCentavos: 0n,
  }

  it('bloqueia approved quando a proposta da própria decisão viola o preço-piso', async () => {
    const decisaoAtual = {
      ...decisaoBase,
      proposta: {
        tipo: 'ajuste_preco',
        sku: 'INF-1042',
        precoAtualCentavos: '10000',
        precoPropostoCentavos: '8000',
        precoPisoCentavos: '10000',
      },
    } as unknown as typeof decisao.$inferSelect

    const tx = criarMockTx({ aiExecutionEnabled: true, nivelAutonomia: 5, estado: 'approved' })

    await expect(
      transitarDecisao(tx, decisaoAtual, 'approved', '00000000-0000-0000-0000-000000000002'),
    ).rejects.toThrow(HardStopError)
  })

  it('permite approved quando a proposta respeita o preço-piso', async () => {
    const decisaoAtual = {
      ...decisaoBase,
      proposta: {
        tipo: 'ajuste_preco',
        sku: 'INF-1042',
        precoAtualCentavos: '10000',
        precoPropostoCentavos: '15000',
        precoPisoCentavos: '10000',
      },
    } as unknown as typeof decisao.$inferSelect

    const tx = criarMockTx({ aiExecutionEnabled: true, nivelAutonomia: 5, estado: 'approved' })

    const r = await transitarDecisao(tx, decisaoAtual, 'approved', '00000000-0000-0000-0000-000000000002')
    expect(r.estado).toBe('approved')
  })
})
