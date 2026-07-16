import { z } from 'zod'

export const NomesFilas = {
  DIAGNOSTICO: 'fila_diagnostico',
  SYNC_ERP: 'fila_sync_erp',
} as const

export const DiagnosticoPayloadSchema = z.object({
  clienteId: z.string().uuid(),
  entidade: z.enum(['produto', 'cliente']),
  entidadeId: z.string(),
})

export type DiagnosticoPayload = z.infer<typeof DiagnosticoPayloadSchema>

export const SyncErpPayloadSchema = z.object({
  clienteId: z.string().uuid(),
  direcao: z.enum(['importar', 'exportar']),
  erpId: z.string().uuid(), // ID da conexão ERP
})

export type SyncErpPayload = z.infer<typeof SyncErpPayloadSchema>
