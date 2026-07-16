import type { AiAgent, AgentActivity } from "../types"
import { listarAgentes, listarAtividade } from "@ai-commerce/core/src/services/agentes.service"
import { getClienteIdAtual } from "../tenant"
import { tempoRelativo } from "../format"

const tipoLabel: Record<string, string> = {
  pricing: "Precificação",
  estoque: "Estoque",
  atendimento: "Atendimento",
  conteudo: "Conteúdo",
  fraude: "Antifraude",
}

export async function getAgents(): Promise<AiAgent[]> {
  try {
    const rows = await listarAgentes(getClienteIdAtual())
    return rows.map((r): AiAgent => ({
      id: r.id,
      name: r.nome,
      type: tipoLabel[r.tipo] ?? r.tipo,
      description: `Autonomia nível ${r.nivelAutonomia}`,
      status: r.ativo ? "active" : "paused",
      actions24h: r.actions24h,
    }))
  } catch (e) {
    console.error("[agents] getAgents:", e instanceof Error ? e.message : e)
    return []
  }
}

export async function getAgentActivity(): Promise<AgentActivity[]> {
  try {
    const rows = await listarAtividade(getClienteIdAtual())
    return rows.map((r): AgentActivity => {
      let action = "Execução concluída"
      const ctx = r.contexto
      if (ctx && typeof ctx === "object" && "acao" in ctx) {
        action = String((ctx as Record<string, unknown>).acao)
      }
      return {
        id: r.id,
        agent: r.agenteNome ?? "Agente",
        action,
        time: tempoRelativo(r.iniciadoEm),
      }
    })
  } catch (e) {
    console.error("[agents] getAgentActivity:", e instanceof Error ? e.message : e)
    return []
  }
}
