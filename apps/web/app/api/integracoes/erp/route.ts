import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import {
  listarConexoesErp,
  salvarCredencialErp,
} from "@ai-commerce/core/src/services/integracoes.service"
import { getClienteIdAtual, getAtorPapelAtual, getAtorIdAtual } from "@/lib/tenant"
import { withApiHandler } from "@/lib/api-handler"
import { AuthorizationError } from "@ai-commerce/core/src/errors"

export const dynamic = "force-dynamic"

export const GET = withApiHandler(async () => {
  const dados = await listarConexoesErp(getClienteIdAtual())
  return NextResponse.json(dados)
})

const bodySchema = z.object({
  erp: z.enum(["bling", "tiny", "outro"]),
  rotulo: z.string().min(1).max(80),
  credenciais: z.record(z.string(), z.string()),
})

export const POST = withApiHandler(async (req: NextRequest) => {
  if (getAtorPapelAtual() !== 'admin') {
    throw new AuthorizationError('Apenas administradores podem gerenciar integrações ERP.')
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.parse(json) // Lança ZodError, capturado pelo withApiHandler

  const resumo = await salvarCredencialErp(getClienteIdAtual(), parsed, getAtorIdAtual())
  return NextResponse.json(resumo, { status: 201 })
})
