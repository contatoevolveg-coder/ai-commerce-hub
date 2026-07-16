import { NextResponse } from "next/server"
import { removerConexaoErp } from "@ai-commerce/core/src/services/integracoes.service"
import { getClienteIdAtual } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await removerConexaoErp(getClienteIdAtual(), params.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[api/integracoes/erp DELETE]", e instanceof Error ? e.message : "erro")
    return NextResponse.json({ erro: "Falha ao remover conexão" }, { status: 500 })
  }
}
