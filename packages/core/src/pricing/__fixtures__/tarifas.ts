// ATENÇÃO: valores FICTÍCIOS para uso exclusivo em testes automatizados.
// Não são as comissões reais do Mercado Livre/Amazon/Shopee. Tarifas reais entram
// via seed quando o usuário fornecer os valores (GUARDRAILS.md: não invente comissão).
import type { CanalTarifaRow, FaixaFrete, FaixaTaxaFixa } from '../types'

export const CATEGORIA_ELETRONICOS = 'eletronicos'

export const TARIFA_ML_ELETRONICOS_JAN_FEV: CanalTarifaRow = {
  canalId: 'mercado_livre',
  categoria: CATEGORIA_ELETRONICOS,
  tipo: 'percentual',
  valorBps: 1200n, // 12% — fictício
  valorCentavos: null,
  matriz: null,
  vigenteDe: new Date('2026-01-01T00:00:00Z'),
  vigenteAte: new Date('2026-02-28T23:59:59Z'),
}

export const TARIFA_ML_ELETRONICOS_MAR_EM_DIANTE: CanalTarifaRow = {
  canalId: 'mercado_livre',
  categoria: CATEGORIA_ELETRONICOS,
  tipo: 'percentual',
  valorBps: 1500n, // 15% — fictício, reajuste simulado a partir de março
  valorCentavos: null,
  matriz: null,
  vigenteDe: new Date('2026-03-01T00:00:00Z'),
  vigenteAte: null,
}

export const TARIFAS_ML_ELETRONICOS = [
  TARIFA_ML_ELETRONICOS_JAN_FEV,
  TARIFA_ML_ELETRONICOS_MAR_EM_DIANTE,
]

export const TARIFA_AMAZON_ELETRONICOS: CanalTarifaRow = {
  canalId: 'amazon',
  categoria: CATEGORIA_ELETRONICOS,
  tipo: 'fixo',
  valorBps: null,
  valorCentavos: 2500n, // fictício
  matriz: null,
  vigenteDe: new Date('2026-01-01T00:00:00Z'),
  vigenteAte: null,
}

export const TARIFA_SHOPEE_ELETRONICOS: CanalTarifaRow = {
  canalId: 'shopee',
  categoria: CATEGORIA_ELETRONICOS,
  tipo: 'matriz',
  valorBps: null,
  valorCentavos: null,
  matriz: [
    { pesoMaximoGramas: 500, precoMaximoCentavos: 10000n, valorCentavos: 300n },
    { pesoMaximoGramas: 500, precoMaximoCentavos: null, valorCentavos: 600n },
    { pesoMaximoGramas: 100000, precoMaximoCentavos: null, valorCentavos: 900n },
  ],
  vigenteDe: new Date('2026-01-01T00:00:00Z'),
  vigenteAte: null,
}

export const FRETE_BRACKETS_FICTICIOS: FaixaFrete[] = [
  { pesoMaximoGramas: 300, precoMaximoCentavos: null, valorCentavos: 1200n },
  { pesoMaximoGramas: 1000, precoMaximoCentavos: null, valorCentavos: 1800n },
  { pesoMaximoGramas: 100000, precoMaximoCentavos: null, valorCentavos: 3200n },
]

export const TAXA_FIXA_BRACKETS_FICTICIOS: FaixaTaxaFixa[] = [
  { precoMaximoCentavos: 7900n, valorCentavos: 600n },
  { precoMaximoCentavos: null, valorCentavos: 0n },
]

export const ALIQUOTA_IMPOSTO_SIMPLES_BPS = 600n // 6% fictício
