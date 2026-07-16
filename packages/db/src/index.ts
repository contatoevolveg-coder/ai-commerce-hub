import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// A aplicação DEVE consultar dados de negócio usando app_role (não-superusuário),
// nunca a role privilegiada de DATABASE_URL — superusuários sempre ignoram RLS
// no Postgres, o que quebraria o isolamento de tenant silenciosamente.
// Ver drizzle/0002_app_role_bootstrap.sql e .env.example.
const connectionString = process.env.APP_DATABASE_URL;

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[CRITICAL] APP_DATABASE_URL não configurada no ambiente de produção. ' +
      'Abortando conexão por segurança (Fail-Closed) para evitar bypass de RLS via superusuário.'
    )
  } else if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn(
      '[db] APP_DATABASE_URL não definida — caindo para DATABASE_URL. ' +
        'Isto conecta como role privilegiada e IGNORA o RLS de multi-tenancy. ' +
        'Configure APP_DATABASE_URL no .env (ver .env.example) antes de ir para produção.',
    );
  }
}

const resolvedConnectionString =
  connectionString ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/ai_commerce';

// prepare:false é obrigatório quando a conexão passa pelo Supavisor em modo
// transaction (porta 6543) — esse modo não suporta prepared statements no nível
// de protocolo, porque cada query pode ser roteada para uma conexão de backend
// diferente do pool. Serverless (Vercel) só alcança o Supabase por essa rota:
// o Postgres do Supabase é IPv6 na conexão direta e a Vercel não tem saída IPv6
// (documentado pela própria Supabase). Sem prepare:false, queries falham de
// forma intermitente com "prepared statement already exists"/"does not exist".
// Inofensivo em conexão direta (dev local) — só desativa uma otimização.
const client = postgres(resolvedConnectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Cliente ADMINISTRATIVO — usa a MESMA conexão privilegiada do seed.ts (DATABASE_URL,
// bypassa RLS). Uso EXCLUSIVO para fluxos de bootstrap sem tenant ainda resolvido:
// login (busca usuário por email, antes de saber o clienteId) e criação de conta
// (criar cliente + primeiro usuário na mesma transação). NUNCA use isto para queries
// de negócio — isso ignora o isolamento de tenant inteiro. Ver ANTIGRAVITY_RULES.md
// Regra 17 (incidente 3).
const adminConnectionString = process.env.DATABASE_URL || resolvedConnectionString;
const adminClient = postgres(adminConnectionString, { prepare: false });
export const dbAuthBootstrap = drizzle(adminClient, { schema });

// Reexports para consumidores (packages/core/services, apps/web). Aditivo — não
// remove nada. `db` é definido ACIMA de propósito: tenant-context reimporta `db`
// daqui, e o import circular só é seguro porque `db` já existe quando é usado
// (em runtime, dentro de withTenant), não no topo do módulo.
export * from './schema';
export * from './tenant-context';
export { DEV_CLIENTE_ID } from './dev-tenant';
