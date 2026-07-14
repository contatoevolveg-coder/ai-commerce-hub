import postgres from 'postgres'

/**
 * Testes de RLS precisam de um Postgres real com a migration 0002 aplicada
 * (app_role). Se APP_DATABASE_URL não estiver configurada ou o banco não
 * estiver de pé, os testes pulam com um aviso — não derrubam a suíte inteira.
 * Rode `docker compose up -d && pnpm db:push` e tente de novo.
 */
export async function verificarBancoDisponivel(): Promise<{
  disponivel: boolean
  motivo?: string
}> {
  const connectionString = process.env.APP_DATABASE_URL
  if (!connectionString) {
    return {
      disponivel: false,
      motivo: 'APP_DATABASE_URL não configurada (ver .env.example)',
    }
  }

  const sql = postgres(connectionString, { max: 1, connect_timeout: 2 })
  try {
    await sql`select 1`
    return { disponivel: true }
  } catch (e) {
    return {
      disponivel: false,
      motivo: e instanceof Error ? e.message : 'erro desconhecido de conexão',
    }
  } finally {
    await sql.end({ timeout: 1 }).catch(() => undefined)
  }
}
