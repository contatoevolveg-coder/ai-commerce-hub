import * as React from "react"
import { LineChart } from "lucide-react"
import { Card, EmptyState } from "@ai-commerce/ui"

export interface ChartCardProps {
  title: string
  value?: string
  isEmpty?: boolean
  children?: React.ReactNode
}

export function ChartCard({ title, value, isEmpty = false, children }: ChartCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium uppercase tracking-wide text-muted">
          {title}
        </span>
        {value && (
          <span className="text-2xl font-bold text-primary-text">{value}</span>
        )}
      </div>
      {isEmpty ? (
        <EmptyState
          icon={<LineChart className="h-7 w-7" />}
          title="Sem dados no período"
        />
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </Card>
  )
}
