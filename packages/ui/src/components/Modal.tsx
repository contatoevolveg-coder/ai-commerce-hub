"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Diálogo modal do design system. Sombra é permitida aqui (regra: sombra só em overlay).
 * Fecha no Escape e no clique fora. z-50 para ficar acima do Shell.
 */
export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-app/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-md rounded-md border border-border-subtle bg-surface-raised shadow-lg",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-primary-text">{title}</h2>
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-muted transition-colors hover:text-primary-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
