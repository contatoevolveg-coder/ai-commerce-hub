import { Badge } from "@ai-commerce/ui"
import { Bot } from "lucide-react"

export interface AgentStatusCardProps {
  name: string
  type: string
  status: "active" | "paused" | "error"
  actions24h: number
}

export function AgentStatusCard({ name, type, status, actions24h }: AgentStatusCardProps) {
  const badgeVariant = 
    status === "active" ? "success" : 
    status === "paused" ? "warning" : "danger"
    
  const statusLabel = 
    status === "active" ? "Ativo" : 
    status === "paused" ? "Pausado" : "Erro"

  return (
    <div className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-hover">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ai/10 text-ai">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-primary-text">{name}</span>
          <span className="text-xs text-muted">{type}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
        <span className="text-xs font-medium text-muted">{actions24h} ações (24h)</span>
      </div>
    </div>
  )
}
