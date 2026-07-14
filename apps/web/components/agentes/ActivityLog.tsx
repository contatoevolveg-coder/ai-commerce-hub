import { Activity } from "lucide-react"
import { EmptyState } from "@ai-commerce/ui"
import type { AgentActivity } from "@/lib/types"

export interface ActivityLogProps {
  activity: AgentActivity[]
}

export function ActivityLog({ activity }: ActivityLogProps) {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle p-6">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted">Atividade recente</h3>
      </div>
      {activity.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="Sem atividade recente"
        />
      ) : (
        <ul className="flex flex-col">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 border-b border-border-subtle px-6 py-4 last:border-b-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-primary-text">{item.agent}</span>
                <span className="text-sm text-muted">{item.action}</span>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted">{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
