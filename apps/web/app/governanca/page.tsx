import { getClienteIdAtual } from '../../lib/tenant'
import { listarTarefas, type TarefaResumo } from '@ai-commerce/core/src/services/governanca.service'
import { type Column, PageHeader, DataTable } from '@ai-commerce/ui'
import { formatData } from '../../lib/format'
import { AIDecisionCardClient } from './AIDecisionCardClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Governança | AI Commerce Hub',
}

export default async function GovernancaPage() {
  const clienteId = getClienteIdAtual()
  const tarefas = await listarTarefas(clienteId)

  // Separamos as tarefas de aprovação de decisão das demais
  const tarefasDecisao = tarefas.filter(t => t.tipo === 'aprovacao_decisao' && t.decisaoId)
  const outrasTarefas = tarefas.filter(t => t.tipo !== 'aprovacao_decisao' || !t.decisaoId)

  const columns: Column<TarefaResumo>[] = [
    { key: 'titulo', label: 'TÍTULO' },
    { key: 'tipo', label: 'TIPO' },
    { 
      key: 'criadoEm', 
      label: 'CRIADO EM',
      render: (t) => formatData(t.criadoEm)
    },
    { key: 'status', label: 'STATUS' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Governança"
      />

      {tarefasDecisao.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-body">Decisões Pendentes</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {tarefasDecisao.map(t => (
              <AIDecisionCardClient key={t.id} tarefa={t} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-body">Fila de Tarefas</h2>
        <DataTable
          columns={columns}
          rows={outrasTarefas}
        />
      </section>
    </div>
  )
}
