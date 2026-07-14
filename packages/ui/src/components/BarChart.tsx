import * as React from "react"
import { cn } from "../lib/utils"

export interface BarChartDatum {
  label: string
  value: number
}

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: BarChartDatum[]
  color?: string
  height?: number
}

const SLOT = 100

export function BarChart({
  data,
  color = "primary",
  height = 180,
  className,
  ...props
}: BarChartProps) {
  if (!data || data.length === 0) return null

  const colorMap: Record<string, string> = {
    primary: "var(--primary, #3B82F6)",
    ai: "var(--ai, #8B5CF6)",
    success: "var(--success, #22C55E)",
    warning: "var(--warning, #F59E0B)",
    danger: "var(--danger, #EF4444)",
  }
  const fillColor = colorMap[color] || color

  const max = Math.max(...data.map((d) => d.value), 1)
  const width = data.length * SLOT
  const barWidth = SLOT * 0.55
  const gap = (SLOT - barWidth) / 2
  const topPad = 8
  const radius = 6

  const topRoundedBar = (x: number, w: number, barHeight: number) => {
    const y = height - barHeight
    const r = Math.min(radius, w / 2, barHeight)
    return `M${x},${height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${
      x + w - r
    },${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${height} Z`
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - topPad)
          const x = i * SLOT + gap
          return (
            <path
              key={i}
              d={topRoundedBar(x, barWidth, barHeight)}
              fill={fillColor}
            />
          )
        })}
      </svg>
      <div className="mt-2 flex">
        {data.map((d, i) => (
          <span
            key={i}
            className="flex-1 truncate px-1 text-center text-xs text-muted"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
