"use client"

import { Bot } from "lucide-react"
import { Badge, Button, Card } from "@ai-commerce/ui"
import { StatusToggle } from "@/components/agentes/StatusToggle"
import type { AiAgent } from "@/lib/types"

const badgeVariants: Record<AiAgent["status"], "success" | "warning" | "danger"> = {
  active: "success",
  paused: "warning",
  error: "danger",
}

const statusLabels: Record<AiAgent["status"], string> = {
  active: "Ativo",
  paused: "Pausado",
  error: "Erro",
}

export interface AgentCardProps {
  agent: AiAgent
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ai/10 text-ai">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-primary-text">{agent.name}</span>
            <span className="text-xs text-muted">{agent.type}</span>
          </div>
        </div>
        <Badge variant={badgeVariants[agent.status]}>{statusLabels[agent.status]}</Badge>
      </div>

      <p className="text-sm text-muted">{agent.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{agent.actions24h} ações (24h)</span>
        <StatusToggle active={agent.status === "active"} />
      </div>

      <Button variant="ghost" size="sm" className="w-full">
        Configurar
      </Button>
    </Card>
  )
}
