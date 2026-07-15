import { NextResponse } from "next/server"
import { listarAgentes, listarAtividade } from "@ai-commerce/core/src/services/agentes.service"
import { getClienteIdAtual } from "@/lib/tenant"
import { serializarBigint } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const clienteId = getClienteIdAtual()
    const [agentes, atividade] = await Promise.all([
      listarAgentes(clienteId),
      listarAtividade(clienteId),
    ])
    return NextResponse.json(serializarBigint({ agentes, atividade }))
  } catch (e) {
    console.error("[api/agentes]", e instanceof Error ? e.message : e)
    return NextResponse.json({ erro: "Falha ao carregar agentes" }, { status: 500 })
  }
}
