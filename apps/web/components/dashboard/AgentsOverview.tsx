import { AgentStatusCard } from "./AgentStatusCard"
import { aiAgents } from "@/lib/mock-data"
import { Button } from "@ai-commerce/ui"

export function AgentsOverview() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-md border border-border-subtle bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Atividade dos Agentes</h3>
        <Button variant="ghost" size="sm" className="h-8">Ver todos</Button>
      </div>
      <div className="flex flex-col gap-3 overflow-auto">
        {aiAgents.map((agent) => (
          <AgentStatusCard key={agent.name} {...agent} />
        ))}
      </div>
    </div>
  )
}
