import * as React from "react"
import { cn } from "../lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md"
}

export function Card({
  children,
  className,
  padding = "md",
  ...props
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
  }
  return (
    <div
      className={cn(
        "rounded-md border border-border-subtle bg-surface",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
