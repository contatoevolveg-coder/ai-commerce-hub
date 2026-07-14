"use client"

import { useState } from "react"
import { cn } from "@ai-commerce/ui/src/lib/utils"

interface PeriodOption {
  value: string
  label: string
}

const options: PeriodOption[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "12m", label: "12m" },
]

export function PeriodSelector() {
  const [period, setPeriod] = useState("30d")

  return (
    <div className="flex items-center gap-1 rounded-full bg-surface-raised p-1">
      {options.map((option) => {
        const isActive = period === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPeriod(option.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-white"
                : "text-muted hover:bg-hover hover:text-body"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
