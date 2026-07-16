import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import {
  listarConexoesErp,
  salvarCredencialErp,
  ChaveCriptografiaAusenteError,
} from "@ai-commerce/core/src/services/integracoes.service"
import { getClienteIdAtual } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const dados = await listarConexoesErp(getClienteIdAtual())
    return NextResponse.json(dados)
  } catch (e) {
    console.error("[api/integracoes/erp GET]", e instanceof Error ? e.message : "erro")
    return NextResponse.json({ erro: "Falha ao carregar conexões" }, { status: 500 })
  }
}

// Zod na fronteira HTTP (AGENTS.md regra 2). A validação por-ERP dos campos de credencial
// acontece no serviço (validarCredenciais, contra o catálogo).
const bodySchema = z.object({
  erp: z.enum(["bling", "tiny", "outro"]),
  rotulo: z.string().min(1).max(80),
  credenciais: z.record(z.string(), z.string()),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 })
  }

  try {
    // Nunca logamos o corpo (contém credenciais). salvarCredencialErp cifra antes de gravar.
    const resumo = await salvarCredencialErp(getClienteIdAtual(), parsed.data)
    return NextResponse.json(resumo, { status: 201 })
  } catch (e) {
    if (e instanceof ChaveCriptografiaAusenteError) {
      return NextResponse.json({ erro: e.message }, { status: 503 })
    }
    if (e instanceof Error && e.message.includes("obrigatório")) {
      // Mensagem de validação de campo (contém só o NOME do campo, nunca o valor).
      return NextResponse.json({ erro: e.message }, { status: 400 })
    }
    console.error("[api/integracoes/erp POST]", "falha ao salvar conexão")
    return NextResponse.json({ erro: "Falha ao salvar conexão" }, { status: 500 })
  }
}
