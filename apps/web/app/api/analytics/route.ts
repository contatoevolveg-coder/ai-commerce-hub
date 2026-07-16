import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { getAnalytics } from "@ai-commerce/core/src/services/analytics.service"
import { getClienteIdAtual } from "@/lib/tenant"
import { serializarBigint } from "@/lib/serialize"

export const dynamic = "force-dynamic"

// Zod em toda fronteira HTTP (AGENTS.md regra 2): valida o único parâmetro de entrada.
const querySchema = z.object({
  period: z
    .string()
    .regex(/^\d{1,3}d$/)
    .optional()
    .default("14d"),
})

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    period: req.nextUrl.searchParams.get("period") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ erro: "Parâmetro 'period' inválido" }, { status: 400 })
  }

  try {
    const dias = parseInt(parsed.data.period, 10)
    const dados = await getAnalytics(getClienteIdAtual(), dias)
    return NextResponse.json(serializarBigint(dados))
  } catch (e) {
    console.error("[api/analytics]", e instanceof Error ? e.message : e)
    return NextResponse.json({ erro: "Falha ao carregar analytics" }, { status: 500 })
  }
}
