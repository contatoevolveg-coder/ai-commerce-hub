import * as React from "react"
import { cn } from "../lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "card" | "row"
}

export function Skeleton({
  className,
  variant = "text",
  ...props
}: SkeletonProps) {
  const variants = {
    text: "h-4 w-full rounded-sm",
    card: "h-32 w-full rounded-md",
    row: "h-11 w-full rounded-sm",
  }
  return (
    <div
      className={cn(
        "animate-pulse bg-surface-raised",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
