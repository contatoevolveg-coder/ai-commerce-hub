import * as React from 'react'
import { cn } from '../lib/utils'

export interface ConfidenceMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number // 0 a 100
}

export function ConfidenceMeter({ score, className, ...props }: ConfidenceMeterProps) {
  const safeScore = Math.max(0, Math.min(100, score))
  
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      <div className="h-2 w-24 bg-surface-raised overflow-hidden rounded-full">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <span className="text-xs text-muted font-variant-numeric tabular-nums">
        {safeScore}%
      </span>
    </div>
  )
}
