import { AgentStatusCard } from "./AgentStatusCard"
import { Button, EmptyState } from "@ai-commerce/ui"
import type { AiAgent } from "@/lib/types"
import { Bot } from "lucide-react"

export function AgentsOverview({ agents }: { agents: AiAgent[] }) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Atividade dos Agentes</h3>
        <Button variant="ghost" size="sm" className="h-8">Ver todos</Button>
      </div>
      {agents.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-6 w-6" />}
          title="Nenhum agente configurado"
          description="Adicione um agente de IA para automatizar suas operações."
          action={<Button variant="ai">Adicionar agente</Button>}
        />
      ) : (
        <div className="flex flex-col gap-3 overflow-auto">
          {agents.map((agent) => (
            <AgentStatusCard key={agent.id} {...agent} />
          ))}
        </div>
      )}
    </div>
  )
}
