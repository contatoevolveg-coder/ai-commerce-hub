import { and, desc, eq, gte } from 'drizzle-orm'
import { withTenant, agente, execucaoAgente } from '@ai-commerce/db'

/** Agentes do tenant, cada um com a contagem de execuções nas últimas 24h. */
export function listarAgentes(clienteId: string) {
  return withTenant(clienteId, async (tx) => {
    const agentes = await tx
      .select({
        id: agente.id,
        nome: agente.nome,
        tipo: agente.tipo,
        ativo: agente.ativo,
        nivelAutonomia: agente.nivelAutonomia,
      })
      .from(agente)
      .where(eq(agente.clienteId, clienteId))

    const desde24h = new Date(Date.now() - 86_400_000)
    const execucoes = await tx
      .select({ agenteId: execucaoAgente.agenteId, iniciadoEm: execucaoAgente.iniciadoEm })
      .from(execucaoAgente)
      .where(and(eq(execucaoAgente.clienteId, clienteId), gte(execucaoAgente.iniciadoEm, desde24h)))

    return agentes.map((a) => ({
      ...a,
      actions24h: execucoes.filter((e) => e.agenteId === a.id).length,
    }))
  })
}

export type AgenteRow = Awaited<ReturnType<typeof listarAgentes>>[number]

/** Feed de atividade recente dos agentes (execuções mais novas primeiro). */
export function listarAtividade(clienteId: string, limite = 8) {
  return withTenant(clienteId, async (tx) => {
    return await tx
      .select({
        id: execucaoAgente.id,
        agenteNome: agente.nome,
        contexto: execucaoAgente.contexto,
        iniciadoEm: execucaoAgente.iniciadoEm,
      })
      .from(execucaoAgente)
      .leftJoin(agente, eq(agente.id, execucaoAgente.agenteId))
      .where(eq(execucaoAgente.clienteId, clienteId))
      .orderBy(desc(execucaoAgente.iniciadoEm))
      .limit(limite)
  })
}

export type AtividadeRow = Awaited<ReturnType<typeof listarAtividade>>[number]
