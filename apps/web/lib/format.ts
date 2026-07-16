/**
 * Formatação de view. Dinheiro é bigint em centavos até aqui (AGENTS.md regra 8);
 * a conversão para string usa matemática inteira — nada de toFixed()/float sobre centavos.
 */

import { formatBRL as formatBRLUI } from '@ai-commerce/ui/src/lib/format'

export function formatBRL(centavos: bigint): string {
  return formatBRLUI(centavos)
}

/** Centavos → reais inteiros, só para magnitude de eixo de gráfico (perde os centavos de propósito). */
export function reaisNumber(centavos: bigint): number {
  return Number(centavos / 100n)
}

export function formatData(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${d.getFullYear()}`
}

export function labelDiaMes(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

export function tempoRelativo(d: Date): string {
  const ms = Date.now() - d.getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}
