import { NextResponse } from "next/server"
import { listarCompradores, resumoCompradores } from "@ai-commerce/core/src/services/clientes.service"
import { getClienteIdAtual } from "@/lib/tenant"
import { serializarBigint } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const clienteId = getClienteIdAtual()
    const [compradores, resumo] = await Promise.all([
      listarCompradores(clienteId),
      resumoCompradores(clienteId),
    ])
    return NextResponse.json(serializarBigint({ compradores, resumo }))
  } catch (e) {
    console.error("[api/clientes]", e instanceof Error ? e.message : e)
    return NextResponse.json({ erro: "Falha ao carregar clientes" }, { status: 500 })
  }
}
