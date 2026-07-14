"use client"

import { useState } from "react"

export interface StatusToggleProps {
  active: boolean
}

export function StatusToggle({ active }: StatusToggleProps) {
  const [on, setOn] = useState(active)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn((prev) => !prev)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ai focus:ring-offset-2 focus:ring-offset-surface ${
        on ? "bg-ai" : "bg-surface-raised"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}
