import { NextResponse } from 'next/server'
import { DEV_CLIENTE_ID } from '@ai-commerce/db'
import { getResumoDashboard } from '@ai-commerce/core/src/services/dashboard.service'

// DIAGNÓSTICO TEMPORÁRIO — público, sem auth. Roda a query real de dashboard
// contra o tenant demo e devolve o resultado OU o erro completo. REMOVER após
// diagnosticar o problema de conexão/RLS em produção.
export const dynamic = 'force-dynamic'

export async function GET() {
  const diag: Record<string, unknown> = {
    temAppDbUrl: !!process.env.APP_DATABASE_URL,
    temDbUrl: !!process.env.DATABASE_URL,
    appDbHost: (process.env.APP_DATABASE_URL || '').replace(/:[^:@/]+@/, ':***@').split('@')[1] || null,
    devClienteId: DEV_CLIENTE_ID,
  }
  try {
    const r = await getResumoDashboard(DEV_CLIENTE_ID)
    return NextResponse.json({
      ok: true,
      ...diag,
      receitaCentavos: r.receitaCentavos.toString(),
      pedidosCount: r.pedidosCount,
      agentesAtivos: r.agentesAtivos,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...diag,
        erroNome: error instanceof Error ? error.name : 'desconhecido',
        erroMensagem: error instanceof Error ? error.message : String(error),
        erroStack: error instanceof Error ? (error.stack || '').split('\n').slice(0, 4).join(' | ') : null,
      },
      { status: 500 },
    )
  }
}
