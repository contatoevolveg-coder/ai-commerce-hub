import * as React from "react"
import { cn } from "../lib/utils"

export interface MiniChartProps extends React.SVGProps<SVGSVGElement> {
  data: number[]
  color?: string // accepts tailwind color classes or hex, we will map standard colors if needed
  height?: number
  showEndpoint?: boolean
}

export function MiniChart({
  data,
  color = "currentColor", // will fall back to css text-primary if not provided, or we can force #3B82F6
  height = 48,
  showEndpoint = true,
  className,
  ...props
}: MiniChartProps) {
  if (!data || data.length === 0) return null

  // Mapeamento simples para usar as variáveis CSS dos tokens caso passe 'primary', 'ai', etc.
  const colorMap: Record<string, string> = {
    primary: "var(--primary, #3B82F6)",
    ai: "var(--ai, #8B5CF6)",
    success: "var(--success, #22C55E)",
    warning: "var(--warning, #F59E0B)",
    danger: "var(--danger, #EF4444)",
  }

  const strokeColor = colorMap[color] || color

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 200 // fixed internal viewBox width
  
  const step = width / (data.length - 1)
  
  const points = data.map((val, i) => {
    const x = i * step
    const y = height - ((val - min) / range) * (height - 4) - 2 // 2px padding top/bottom
    return `${x},${y}`
  })
  
  const polylinePoints = points.join(" ")
  const areaPoints = `${points[0].split(',')[0]},${height} ${polylinePoints} ${points[points.length - 1].split(',')[0]},${height}`
  const lastPoint = points[points.length - 1].split(',')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full", className)}
      style={{ height }}
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <linearGradient id={`gradient-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      
      <polygon
        points={areaPoints}
        fill={`url(#gradient-${strokeColor})`}
      />
      
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      
      {showEndpoint && (
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="4"
          fill={strokeColor}
          stroke="var(--surface, #111827)"
          strokeWidth="2"
        />
      )}
    </svg>
  )
}
