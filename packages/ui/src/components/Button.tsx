import * as React from "react"
import { cn } from "../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "ai" | "danger"
  size?: "default" | "sm" | "lg"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-text hover:bg-blue-600 border border-primary",
      secondary: "bg-surface-raised text-body hover:bg-hover border border-border-strong",
      ghost: "bg-transparent text-body hover:bg-hover",
      ai: "bg-ai text-primary-text hover:bg-purple-600 border border-ai",
      danger: "bg-danger text-primary-text hover:bg-red-600 border border-danger",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-text border-t-transparent" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
