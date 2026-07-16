'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AIDecisionCard } from '@ai-commerce/ui/src/components/AIDecisionCard'
// sem sonner, usando alert nativo para manter simplicidade

export function AIDecisionCardClient({ tarefa }: { tarefa: Record<string, unknown> }) {
  const router = useRouter()
  const [isAprovando, setIsAprovando] = React.useState(false)
  const [isRejeitando, setIsRejeitando] = React.useState(false)

  const handleAprovar = async () => {
    setIsAprovando(true)
    try {
      const res = await fetch(`/api/governanca/tarefas/${tarefa.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aprovar' })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Erro: ${data.error}`)
      } else {
        router.refresh()
      }
    } catch (e: unknown) {
      if (e instanceof Error) alert(`Erro: ${e.message}`)
    } finally {
      setIsAprovando(false)
    }
  }

  const handleRejeitar = async () => {
    setIsRejeitando(true)
    try {
      const res = await fetch(`/api/governanca/tarefas/${tarefa.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'rejeitar', motivo: 'Rejeitado manualmente' })
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Erro: ${data.error}`)
      } else {
        router.refresh()
      }
    } catch (e: unknown) {
      if (e instanceof Error) alert(`Erro: ${e.message}`)
    } finally {
      setIsRejeitando(false)
    }
  }

  // Prepara os dados para o Card baseado na proposta guardada
  const proposta = (tarefa.decisaoProposta as Record<string, unknown>) || {}
  
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-body">{String(tarefa.titulo)}</h3>
      <AIDecisionCard
        valorNovoCentavos={proposta.preco_novo ? BigInt(proposta.preco_novo as number) : undefined}
        raciocinio={String(tarefa.decisaoRaciocinio || tarefa.descricao || '')}
        impactoReaisCentavos={tarefa.decisaoImpacto ? BigInt(tarefa.decisaoImpacto as number) : 0n}
        impactoMargemBps={0} // Mock temporário, margem real precisaria do custo
        confianca={Number(tarefa.decisaoConfianca || 0)}
        onAprovar={handleAprovar}
        onRejeitar={handleRejeitar}
        isAprovando={isAprovando}
        isRejeitando={isRejeitando}
      />
    </div>
  )
}
