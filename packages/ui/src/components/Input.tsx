import * as React from "react"
import { cn } from "../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full rounded-sm border border-border-subtle bg-surface px-3 py-2 text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
