import { Bot } from "lucide-react"
import { Button, EmptyState, PageHeader } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { AgentCard } from "@/components/agentes/AgentCard"
import { ActivityLog } from "@/components/agentes/ActivityLog"
import { getAgents, getAgentActivity } from "@/lib/data/agents"

export const dynamic = "force-dynamic"

export default async function AgentesPage() {
  const [agents, activity] = await Promise.all([
    getAgents(),
    getAgentActivity(),
  ])

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Agentes IA"
          subtitle="Gerencie os agentes que operam sua loja"
          actions={<Button variant="ai">Criar agente</Button>}
        />

        {agents.length === 0 ? (
          <EmptyState
            icon={<Bot className="h-7 w-7 text-ai" />}
            title="Nenhum agente configurado"
            description="Crie seu primeiro agente para automatizar sua operação"
            action={<Button variant="ai">Criar agente</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}

        <ActivityLog activity={activity} />
      </div>
    </Shell>
  )
}
