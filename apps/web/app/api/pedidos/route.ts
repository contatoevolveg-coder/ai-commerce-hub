import { NextResponse } from "next/server"
import { listarPedidos, resumoPedidos } from "@ai-commerce/core/src/services/pedidos.service"
import { getClienteIdAtual } from "@/lib/tenant"
import { serializarBigint } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const clienteId = getClienteIdAtual()
    const [pedidos, resumo] = await Promise.all([
      listarPedidos(clienteId),
      resumoPedidos(clienteId),
    ])
    return NextResponse.json(serializarBigint({ pedidos, resumo }))
  } catch (e) {
    console.error("[api/pedidos]", e instanceof Error ? e.message : e)
    return NextResponse.json({ erro: "Falha ao carregar pedidos" }, { status: 500 })
  }
}
