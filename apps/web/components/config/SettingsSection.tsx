import type { ReactNode } from "react"
import { Card } from "@ai-commerce/ui"

export interface SettingsSectionProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-primary-text">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </Card>
  )
}
