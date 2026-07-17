import { PageHeader, Card, Badge } from "@ai-commerce/ui"
import { Shell } from "@/components/Shell"
import { listarConexoesErp } from "@ai-commerce/core/src/services/integracoes.service"
import { getClienteIdAtual } from "@/lib/tenant"

export const dynamic = "force-dynamic"

export default async function IntegracoesPage() {
  const clienteId = getClienteIdAtual()
  const erps = await listarConexoesErp(clienteId)
  
  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Integrações e Conectores"
          subtitle="Saúde da sincronização com ERPs e Marketplaces"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card padding="md">
            <h3 className="mb-4 text-lg font-semibold leading-none tracking-tight">ERP Fonte</h3>
            <div>
              {erps.length === 0 ? (
                <div className="text-sm text-muted">Nenhum ERP configurado.</div>
              ) : (
                <div className="space-y-4">
                  {erps.map((erp) => (
                    <div key={erp.id} className="flex items-center justify-between rounded-md border border-border-subtle p-4">
                      <div>
                        <div className="font-medium text-primary-text">{erp.rotulo}</div>
                        <div className="text-sm text-muted capitalize">{erp.erp}</div>
                        <div className="text-xs text-muted mt-1">
                          Última sincronização: {erp.atualizadoEm ? new Date(erp.atualizadoEm).toLocaleString('pt-BR') : 'Nunca'}
                        </div>
                      </div>
                      <Badge variant={erp.status === 'conectado' ? 'success' : 'danger'}>
                        {erp.status === 'conectado' ? 'Ativo' : 'Erro'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card padding="md">
            <h3 className="mb-4 text-lg font-semibold leading-none tracking-tight">Marketplaces (Canais)</h3>
            <div>
              <div className="text-sm text-muted mb-4">
                O status de sincronização (produto_espelho.ultimaSincronizacao) aparecerá aqui quando o Agente de Marketplace (F7) estiver rodando.
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-border-subtle p-4 opacity-50">
                  <div>
                    <div className="font-medium text-primary-text">Mercado Livre</div>
                    <div className="text-xs text-muted mt-1">
                      Última sincronização: Pendente
                    </div>
                  </div>
                  <Badge variant="warning">Aguardando Worker</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
