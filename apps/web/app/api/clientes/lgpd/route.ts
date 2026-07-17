import { NextResponse } from 'next/server'
import { withTenant, cliente } from '@ai-commerce/db'
import { sql, eq } from 'drizzle-orm'
import { getClienteIdAtual, getAtorPapelAtual, getAtorIdAtual } from '../../../../lib/tenant'

/**
 * Exclusão total do tenant (LGPD — direito ao esquecimento). Destrutivo e irreversível.
 * Protegido por: papel admin, token de confirmação explícito, e clienteId derivado SÓ da
 * sessão (nunca do body) — um admin só pode apagar a própria loja.
 */
export async function DELETE(req: Request) {
  try {
    if (getAtorPapelAtual() !== 'admin') {
      return NextResponse.json(
        { erro: 'Proibido. Apenas administradores podem solicitar a exclusão da conta.' },
        { status: 403 },
      )
    }

    const body = await req.json().catch(() => ({}))
    if (body.confirmarExclusao !== 'ESTOU_CIENTE') {
      return NextResponse.json(
        { erro: 'Confirmação inválida. Envie confirmarExclusao: "ESTOU_CIENTE".' },
        { status: 400 },
      )
    }

    const clienteId = getClienteIdAtual()
    const atorId = getAtorIdAtual()
    if (!clienteId) {
      return NextResponse.json({ erro: 'Sessão inválida.' }, { status: 401 })
    }

    // Registro PERMANENTE e externo ao tenant (logs da plataforma), gravado ANTES do cascade —
    // o audit_log interno é apagado junto, então este é o rastro que sobrevive à exclusão.
    console.info(
      `[LGPD_AUDIT] Exclusão de dados (direito ao esquecimento) do tenant ${clienteId}, ` +
        `iniciada pelo admin ${atorId} em ${new Date().toISOString()}.`,
    )

    await withTenant(clienteId, async (tx) => {
      // Sinaliza o purge deliberado para o trigger append-only do audit_log permitir o cascade
      // DELETE (migration 0011). Transaction-local: não vaza para outras operações.
      await tx.execute(sql`select set_config('app.purge_tenant', 'on', true)`)
      // ON DELETE CASCADE em todo o schema remove todo o rastro do tenant.
      await tx.delete(cliente).where(eq(cliente.id, clienteId))
    })

    return NextResponse.json({ sucesso: true, mensagem: 'Tenant excluído com sucesso.' })
  } catch (err) {
    console.error('Erro ao deletar tenant (LGPD):', err)
    return NextResponse.json({ erro: 'Erro interno ao processar a exclusão.' }, { status: 500 })
  }
}
