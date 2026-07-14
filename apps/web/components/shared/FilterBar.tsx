"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@ai-commerce/ui"

export interface FilterBarProps {
  placeholder?: string
  value: string
  onChange: (v: string) => void
  children?: React.ReactNode
}

export function FilterBar({
  placeholder = "Buscar...",
  value,
  onChange,
  children,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  )
}
