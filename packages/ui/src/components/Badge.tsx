import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-surface-raised text-body",
    success: "bg-success/12 text-success",
    warning: "bg-warning/12 text-warning",
    danger: "bg-danger/12 text-danger",
  }
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
