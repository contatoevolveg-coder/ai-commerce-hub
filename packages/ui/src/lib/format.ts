/**
 * Formatação monetária segura. Dinheiro é bigint em centavos.
 * A conversão para string usa matemática inteira — nada de toFixed()/float sobre centavos.
 */
export function formatBRL(centavos: bigint): string {
  const negativo = centavos < 0n
  const abs = negativo ? -centavos : centavos
  const reais = abs / 100n
  const cents = abs % 100n
  const reaisStr = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const centsStr = cents.toString().padStart(2, '0')
  return `${negativo ? '-' : ''}R$ ${reaisStr},${centsStr}`
}

export function formatBRLDiff(centavos: bigint): string {
  const str = formatBRL(centavos)
  if (centavos > 0n) return `+${str}`
  return str
}

export function reaisNumber(centavos: bigint): number {
  return Number(centavos / 100n)
}
