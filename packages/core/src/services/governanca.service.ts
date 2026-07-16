import { eq, and } from 'drizzle-orm'
import { withTenant, tarefa, decisao } from '@ai-commerce/db'
import { transitarDecisao } from '../decisions/maquina-estados'
import { NotFoundError, AuthorizationError } from '../errors'

export interface TarefaResumo {
  id: string
  tipo: string
  titulo: string
  descricao: string | null
  status: string
  prazo: Date | null
  criadoEm: Date
  decisaoId: string | null
  decisaoProposta: unknown | null
  decisaoRaciocinio: string | null
  decisaoImpacto: bigint | null
  decisaoConfianca: number | null
}

export function listarTarefas(clienteId: string, limit: number = 50, offset: number = 0): Promise<TarefaResumo[]> {
  return withTenant(clienteId, async (tx) => {
    return await tx
      .select({
        id: tarefa.id,
        tipo: tarefa.tipo,
        titulo: tarefa.titulo,
        descricao: tarefa.descricao,
        status: tarefa.status,
        prazo: tarefa.prazo,
        criadoEm: tarefa.createdAt,
        decisaoId: tarefa.decisaoId,
        decisaoProposta: decisao.proposta,
        decisaoRaciocinio: decisao.raciocinio,
        decisaoImpacto: decisao.impactoEstimadoCentavos,
        decisaoConfianca: decisao.confianca,
      })
      .from(tarefa)
      .leftJoin(decisao, and(eq(tarefa.decisaoId, decisao.id), eq(decisao.clienteId, clienteId)))
      .where(eq(tarefa.clienteId, clienteId))
      .orderBy(tarefa.createdAt)
      .limit(limit)
      .offset(offset)
  })
}

export function criarTarefa(clienteId: string, dados: typeof tarefa.$inferInsert) {
  return withTenant(clienteId, async (tx) => {
    const [nova] = await tx
      .insert(tarefa)
      .values({ ...dados, clienteId })
      .returning()
    return nova
  })
}

export async function aprovarTarefa(clienteId: string, tarefaId: string, atorPapel: string, atorId: string = 'sistema') {
  if (atorPapel === 'auditor') {
    throw new Error('Acesso negado: Auditores não têm permissão para aprovar tarefas.')
  }

  return withTenant(clienteId, async (tx) => {
    // 1. Busca a tarefa
    const [t] = await tx.select().from(tarefa).where(and(eq(tarefa.id, tarefaId), eq(tarefa.clienteId, clienteId)))
    if (!t) throw new NotFoundError('Tarefa não encontrada')

    // 2. Atualiza estado da decisão usando a máquina de estados
    if (t.decisaoId) {
      const [d] = await tx.select().from(decisao).where(and(eq(decisao.id, t.decisaoId), eq(decisao.clienteId, clienteId)))
      if (d) {
        // A máquina de estados vai rodar os guardrails de Hard Stop (preço-piso, atacado, kill switch)
        // Se algum violar, ela lançará um HardStopError e abortará a transação
        await transitarDecisao(tx, d, 'approved', atorId, 'Aprovado via Governance Center')
      } else {
        throw new NotFoundError('Decisão referenciada pela tarefa não encontrada ou sem acesso')
      }
    }

    // 3. Atualiza status da tarefa para concluída (somente se a transição da decisão teve sucesso)
    await tx.update(tarefa).set({ status: 'concluida', atualizadoEm: new Date() }).where(and(eq(tarefa.id, tarefaId), eq(tarefa.clienteId, clienteId)))

    return true
  })
}

export async function rejeitarTarefa(clienteId: string, tarefaId: string, motivo: string, atorPapel: string, atorId: string = 'sistema') {
  if (atorPapel === 'auditor') {
    throw new AuthorizationError('Acesso negado: Auditores não têm permissão para rejeitar tarefas.')
  }

  return withTenant(clienteId, async (tx) => {
    // 1. Busca a tarefa
    const [t] = await tx.select().from(tarefa).where(and(eq(tarefa.id, tarefaId), eq(tarefa.clienteId, clienteId)))
    if (!t) throw new NotFoundError('Tarefa não encontrada')

    // 2. Atualiza estado da decisão, se houver
    if (t.decisaoId) {
      const [d] = await tx.select().from(decisao).where(and(eq(decisao.id, t.decisaoId), eq(decisao.clienteId, clienteId)))
      if (d) {
        await transitarDecisao(tx, d, 'rejected', atorId, motivo)
      } else {
        throw new NotFoundError('Decisão referenciada pela tarefa não encontrada ou sem acesso')
      }
    }

    // 3. Atualiza status da tarefa para concluída (foi resolvida, mesmo que rejeitada)
    await tx.update(tarefa).set({ status: 'concluida', atualizadoEm: new Date() }).where(and(eq(tarefa.id, tarefaId), eq(tarefa.clienteId, clienteId)))

    return true
  })
}
