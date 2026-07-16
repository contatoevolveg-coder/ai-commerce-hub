import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export const DiagnosticoSchema = z.object({
  tituloSugerido: z.string().describe('Um título otimizado para SEO em marketplaces'),
  descricaoSugerida: z.string().describe('Uma descrição persuasiva e com os benefícios do produto'),
  motivos: z.array(z.string()).describe('Lista de motivos explicando o que estava errado ou fraco no original'),
  confianca: z.number().min(0).max(100).describe('Sua confiança nesta sugestão, de 0 a 100'),
})

export type DiagnosticoResult = z.infer<typeof DiagnosticoSchema>

export async function analisarProduto(produto: {
  nome: string
  categoria: string | null
  preco: number | bigint
}): Promise<{ resultado: DiagnosticoResult; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: DiagnosticoSchema,
    system: `Você é um especialista em E-commerce e SEO de Marketplaces. 
Sua tarefa é analisar o cadastro de um produto e sugerir melhorias focadas em conversão.
Regras:
1. O título deve ser claro, ter palavras-chave fortes, e não ultrapassar 60 caracteres se possível.
2. Seja objetivo nos motivos da mudança.`,
    prompt: `Analise este produto:
Nome atual: ${produto.nome}
Categoria: ${produto.categoria || 'Não definida'}
Preço: R$ ${Number(produto.preco) / 100}`,
  })

  return {
    resultado: result.object as DiagnosticoResult,
    usage: result.usage as unknown as { promptTokens: number; completionTokens: number; totalTokens: number },
  }
}
