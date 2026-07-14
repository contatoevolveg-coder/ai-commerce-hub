import * as React from "react"
import { cn } from "../lib/utils"

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  hint?: string
  htmlFor?: string
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
  ...props
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      <label htmlFor={htmlFor} className="text-sm text-body">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  )
}
