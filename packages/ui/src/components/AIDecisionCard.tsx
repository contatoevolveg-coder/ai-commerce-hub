import * as React from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { ConfidenceMeter } from './ConfidenceMeter'
import { Money } from './Money'
import { formatBRLDiff } from '../lib/format'
import { cn } from '../lib/utils'

export interface AIDecisionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  valorAntigoCentavos?: bigint
  valorNovoCentavos?: bigint
  raciocinio: string
  impactoReaisCentavos: bigint
  impactoMargemBps: number
  confianca: number
  onAprovar: () => void
  onRejeitar: () => void
  isAprovando?: boolean
  isRejeitando?: boolean
}

export function AIDecisionCard({
  valorAntigoCentavos,
  valorNovoCentavos,
  raciocinio,
  impactoReaisCentavos,
  impactoMargemBps,
  confianca,
  onAprovar,
  onRejeitar,
  isAprovando,
  isRejeitando,
  className,
  ...props
}: AIDecisionCardProps) {
  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)} {...props}>
      {/* 1. Diff Visual */}
      <div className="flex items-center gap-3 text-lg font-medium">
        {valorAntigoCentavos !== undefined && (
          <span className="text-muted line-through">
            <Money centavos={valorAntigoCentavos} />
          </span>
        )}
        {valorAntigoCentavos !== undefined && valorNovoCentavos !== undefined && (
          <span className="text-muted">→</span>
        )}
        {valorNovoCentavos !== undefined && (
          <span className="text-primary">
            <Money centavos={valorNovoCentavos} />
          </span>
        )}
      </div>

      {/* 2. Raciocínio (borda esquerda accent/ai) */}
      <div className="border-l-2 border-l-ai bg-surface pl-4 py-3 text-sm text-body rounded-r-md">
        {raciocinio}
      </div>

      {/* 3. Impacto Financeiro */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-muted text-xs uppercase tracking-wider">Impacto Estimado</span>
          <span className={cn('font-medium font-variant-numeric tabular-nums', impactoReaisCentavos >= 0n ? 'text-success' : 'text-danger')}>
            {formatBRLDiff(impactoReaisCentavos)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted text-xs uppercase tracking-wider">Margem</span>
          <span className={cn('font-medium font-variant-numeric tabular-nums', impactoMargemBps >= 0 ? 'text-success' : 'text-danger')}>
            {impactoMargemBps >= 0 ? '+' : '-'}{Math.floor(Math.abs(impactoMargemBps) / 100)},{String(Math.abs(impactoMargemBps) % 100).padStart(2, '0')} p.p.
          </span>
        </div>
      </div>

      {/* 4. Confiança */}
      <div className="flex flex-col gap-1 mt-2">
        <span className="text-muted text-xs uppercase tracking-wider">Confiança da IA</span>
        <ConfidenceMeter score={confianca} />
      </div>

      {/* 5. Ações */}
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={onAprovar} disabled={isAprovando || isRejeitando} variant="primary">
          {isAprovando ? 'Aprovando...' : 'Aprovar'}
        </Button>
        <Button variant="secondary" onClick={onRejeitar} disabled={isAprovando || isRejeitando}>
          {isRejeitando ? 'Rejeitando...' : 'Rejeitar e treinar'}
        </Button>
      </div>
    </Card>
  )
}
