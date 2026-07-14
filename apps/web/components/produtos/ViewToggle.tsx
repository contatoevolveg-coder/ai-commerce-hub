"use client"

import { LayoutGrid, List } from "lucide-react"
import { cn } from "@ai-commerce/ui/src/lib/utils"

export type ViewMode = "grid" | "list"

export interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const options: { mode: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { mode: "grid", label: "Grade", icon: LayoutGrid },
    { mode: "list", label: "Lista", icon: List },
  ]

  return (
    <div className="inline-flex items-center gap-1 rounded-sm border border-border-subtle bg-surface p-1">
      {options.map((option) => {
        const isActive = value === option.mode
        return (
          <button
            key={option.mode}
            type="button"
            aria-label={option.label}
            aria-pressed={isActive}
            onClick={() => onChange(option.mode)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors",
              isActive
                ? "bg-hover text-primary-text"
                : "text-muted hover:bg-hover hover:text-body"
            )}
          >
            <option.icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
