import * as React from 'react'
import { formatBRL } from '../lib/format'
import { cn } from '../lib/utils'

export interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  centavos: bigint
}

export function Money({ centavos, className, ...props }: MoneyProps) {
  return (
    <span className={cn('font-variant-numeric tabular-nums', className)} {...props}>
      {formatBRL(centavos)}
    </span>
  )
}
