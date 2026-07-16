import { NextResponse } from "next/server"
import { getResumoDashboard, getSerieVendas } from "@ai-commerce/core/src/services/dashboard.service"
import { getClienteIdAtual } from "@/lib/tenant"
import { serializarBigint } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const clienteId = getClienteIdAtual()
    const [resumo, serie] = await Promise.all([
      getResumoDashboard(clienteId),
      getSerieVendas(clienteId, 14),
    ])
    return NextResponse.json(serializarBigint({ resumo, serie }))
  } catch (e) {
    console.error("[api/dashboard]", e instanceof Error ? e.message : e)
    return NextResponse.json({ erro: "Falha ao carregar dashboard" }, { status: 500 })
  }
}
