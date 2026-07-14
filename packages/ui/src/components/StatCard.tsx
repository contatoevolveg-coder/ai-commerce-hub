import * as React from "react"
import { cn } from "../lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string
  change?: {
    value: number
    trend: "up" | "down"
  }
  icon?: React.ReactNode
  accentColor?: "primary" | "ai" | "success" | "warning"
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  accentColor,
  className,
  ...props 
}: StatCardProps) {
  const accentClasses = {
    primary: "border-l-primary",
    ai: "border-l-ai",
    success: "border-l-success",
    warning: "border-l-warning",
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border-subtle bg-surface p-6 shadow-sm",
        accentColor && `border-l-4 ${accentClasses[accentColor]}`,
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{title}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-semibold text-primary-text">{value}</span>
        {change && (
          <span
            className={cn(
              "flex items-center text-sm font-medium",
              change.trend === "up" ? "text-success" : "text-danger"
            )}
          >
            {change.trend === "up" ? (
              <ArrowUpIcon className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4" />
            )}
            {change.value}%
          </span>
        )}
      </div>
    </div>
  )
}
