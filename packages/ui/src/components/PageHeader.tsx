import * as React from "react"
import { cn } from "../lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-primary-text">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
