import { NextResponse, type NextRequest } from "next/server"
import { removerConexaoErp } from "@ai-commerce/core/src/services/integracoes.service"
import { getClienteIdAtual, getAtorPapelAtual, getAtorIdAtual } from "@/lib/tenant"
import { withApiHandler } from "@/lib/api-handler"
import { AuthorizationError } from "@ai-commerce/core/src/errors"
import { z } from "zod"

export const dynamic = "force-dynamic"

const paramsSchema = z.object({
  id: z.string().uuid("ID inválido"),
})

export const DELETE = withApiHandler(async (_req: NextRequest, { params }) => {
  if (getAtorPapelAtual() !== 'admin') {
    throw new AuthorizationError('Apenas administradores podem remover integrações ERP.')
  }

  const { id } = paramsSchema.parse(params)

  await removerConexaoErp(getClienteIdAtual(), id, getAtorIdAtual())
  return NextResponse.json({ ok: true })
})
