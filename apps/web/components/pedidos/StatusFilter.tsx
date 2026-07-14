"use client"

import { cn } from "@ai-commerce/ui/src/lib/utils"
import type { Order } from "@/lib/types"

export type StatusValue = Order["status"] | "all"

interface StatusOption {
  value: StatusValue
  label: string
}

const options: StatusOption[] = [
  { value: "all", label: "Todos" },
  { value: "processing", label: "Processando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
]

export interface StatusFilterProps {
  value: StatusValue
  onChange: (value: StatusValue) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-white"
                : "bg-surface-raised text-muted hover:bg-hover hover:text-body"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
