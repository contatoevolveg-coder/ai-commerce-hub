import { NextResponse } from 'next/server'
import { z } from 'zod'
import { aprovarTarefa, rejeitarTarefa } from '@ai-commerce/core/src/services/governanca.service'
import { getClienteIdAtual, getAtorPapelAtual, getAtorIdAtual } from '../../../../../lib/tenant'
import { HardStopError, PendingReviewRequiredError } from '@ai-commerce/core/src/decisions/guardrails'

const bodySchema = z.object({
  acao: z.enum(['aprovar', 'rejeitar']),
  motivo: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clienteId = getClienteIdAtual()
    const atorPapel = getAtorPapelAtual()
    const atorId = getAtorIdAtual()
    
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const { acao, motivo } = parsed.data

    if (acao === 'aprovar') {
      await aprovarTarefa(clienteId, params.id, atorPapel, atorId)
    } else {
      await rejeitarTarefa(
        clienteId, 
        params.id, 
        motivo || 'Rejeitado via Governança', 
        atorPapel, 
        atorId
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof HardStopError) {
      return NextResponse.json({ error: `Bloqueado por guardrail: ${error.message}` }, { status: 422 })
    }
    if (error instanceof PendingReviewRequiredError) {
      return NextResponse.json({ error: `Requer revisão: ${error.message}` }, { status: 422 })
    }
    if (error instanceof Error) {
      if (error.message?.includes('Transição inválida')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message?.includes('Acesso negado')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message?.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }
    
    console.error('[POST /api/governanca/tarefas]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
