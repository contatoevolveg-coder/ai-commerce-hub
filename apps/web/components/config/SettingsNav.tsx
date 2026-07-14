"use client"

import type { LucideIcon } from "lucide-react"
import { User, Store, Plug, Bell, CreditCard } from "lucide-react"

export type SettingsSectionKey =
  | "perfil"
  | "loja"
  | "integracoes"
  | "notificacoes"
  | "faturamento"

interface SettingsNavItem {
  key: SettingsSectionKey
  label: string
  icon: LucideIcon
}

const items: SettingsNavItem[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "loja", label: "Loja", icon: Store },
  { key: "integracoes", label: "Integrações", icon: Plug },
  { key: "notificacoes", label: "Notificações", icon: Bell },
  { key: "faturamento", label: "Faturamento", icon: CreditCard },
]

export interface SettingsNavProps {
  active: SettingsSectionKey
  onChange: (key: SettingsSectionKey) => void
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-3 rounded-sm border-l-2 px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? "border-primary bg-hover text-primary-text"
                : "border-transparent text-body hover:bg-hover hover:text-primary-text"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
