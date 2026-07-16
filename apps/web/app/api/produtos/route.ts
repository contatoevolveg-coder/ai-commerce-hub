import { NextResponse } from "next/server"
import { listarProdutos } from "@ai-commerce/core/src/services/produtos.service"
import { getClienteIdAtual } from "@/lib/tenant"
import { serializarBigint } from "@/lib/serialize"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const dados = await listarProdutos(getClienteIdAtual())
    return NextResponse.json(serializarBigint(dados))
  } catch (e) {
    console.error("[api/produtos]", e instanceof Error ? e.message : e)
    return NextResponse.json({ erro: "Falha ao carregar produtos" }, { status: 500 })
  }
}
