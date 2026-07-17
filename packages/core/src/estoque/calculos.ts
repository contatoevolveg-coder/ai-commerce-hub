/**
 * Motor de cálculos de estoque (puro).
 * Todas as funções são determinísticas e livres de side-effects.
 */

/**
 * Representa um movimento de estoque para o cálculo de giro.
 */
export interface MovimentoEstoqueSimplificado {
  tipo: 'entrada' | 'saida' | 'ajuste' | 'reserva'
  quantidade: number
  criadoEm: Date
}

/**
 * Calcula o Giro (Sales Velocity) em um período de dias analisando os movimentos de saída.
 * Um movimento de 'saida' costuma representar venda no domínio do e-commerce.
 * @param movimentos Array de movimentos do produto
 * @param dataReferencia Data base para cálculo do período (normalmente now)
 * @param periodoDias Janela de tempo a considerar (ex: últimos 30 dias)
 * @returns Quantidade total vendida/saída no período
 */
export function calcularGiro(
  movimentos: MovimentoEstoqueSimplificado[],
  dataReferencia: Date,
  periodoDias: number = 30
): number {
  if (periodoDias <= 0) return 0

  const limiteData = new Date(dataReferencia.getTime() - periodoDias * 24 * 60 * 60 * 1000)
  
  return movimentos
    .filter(m => m.tipo === 'saida' && m.criadoEm >= limiteData && m.criadoEm <= dataReferencia)
    .reduce((total, m) => total + m.quantidade, 0)
}

/**
 * Calcula a Cobertura em Dias de um produto.
 * Cobertura = quantidade atual / media_de_vendas_por_dia
 * @param quantidadeDisponivel Estoque atual disponível
 * @param vendasNoPeriodo Total de saídas no período (Giro)
 * @param periodoDias Número de dias do período analisado
 * @returns Cobertura estimada em dias (Infinity se vendasNoPeriodo for 0)
 */
export function calcularCoberturaEmDias(
  quantidadeDisponivel: number,
  vendasNoPeriodo: number,
  periodoDias: number = 30
): number {
  if (quantidadeDisponivel <= 0) return 0
  if (vendasNoPeriodo <= 0 || periodoDias <= 0) return Infinity
  
  const vendasPorDia = vendasNoPeriodo / periodoDias
  return quantidadeDisponivel / vendasPorDia
}

/**
 * Identifica se um produto está em ruptura ou prestes a entrar, baseado em um limite de segurança.
 * @param coberturaEmDias Cobertura atual calculada
 * @param limiteSegurancaDias Quantidade de dias mínima de cobertura antes de alertar ruptura
 * @returns true se estiver em ruptura de segurança
 */
export function identificarRuptura(
  coberturaEmDias: number,
  limiteSegurancaDias: number = 15
): boolean {
  return coberturaEmDias <= limiteSegurancaDias
}
