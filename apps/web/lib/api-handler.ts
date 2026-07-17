import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import {
  DomainError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
} from '@ai-commerce/core/src/errors'
import { ChaveCriptografiaAusenteError } from '@ai-commerce/core/src/services/integracoes.service'
import { getClienteIdAtual, getAtorIdAtual, getAtorPapelAtual } from './tenant'

type HandlerFunction = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<NextResponse>

export function withApiHandler(handler: HandlerFunction) {
  return async (req: NextRequest, ctx: { params: Record<string, string> } = { params: {} }) => {
    try {
      // Injeta o Tenant atual para garantir que está rodando dentro do contexto (validação)
      const clienteId = getClienteIdAtual()
      if (!clienteId) {
        throw new AuthorizationError('Tenant não identificado na requisição.')
      }

      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { erro: 'Dados inválidos', detalhes: error.errors },
          { status: 400 }
        )
      }

      if (error instanceof ChaveCriptografiaAusenteError) {
        return NextResponse.json({ erro: error.message }, { status: 503 })
      }

      if (error instanceof AuthorizationError) {
        return NextResponse.json({ erro: error.message }, { status: 403 })
      }

      if (error instanceof ValidationError) {
        return NextResponse.json({ erro: error.message }, { status: 400 })
      }

      if (error instanceof NotFoundError) {
        return NextResponse.json({ erro: error.message }, { status: 404 })
      }

      if (error instanceof DomainError) {
        return NextResponse.json({ erro: error.message }, { status: 400 })
      }

      // Erros genéricos
      console.error(`[API Handler Error] ${req.method} ${req.nextUrl.pathname}`, error)
      const detalhe =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      return NextResponse.json(
        { erro: 'Erro interno do servidor.', detalhe },
        { status: 500 },
      )
    }
  }
}
