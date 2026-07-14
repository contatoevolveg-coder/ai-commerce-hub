import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// A aplicação DEVE consultar dados de negócio usando app_role (não-superusuário),
// nunca a role privilegiada de DATABASE_URL — superusuários sempre ignoram RLS
// no Postgres, o que quebraria o isolamento de tenant silenciosamente.
// Ver drizzle/0002_app_role_bootstrap.sql e .env.example.
const connectionString = process.env.APP_DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(
    '[db] APP_DATABASE_URL não definida — caindo para DATABASE_URL. ' +
      'Isto conecta como role privilegiada e IGNORA o RLS de multi-tenancy. ' +
      'Configure APP_DATABASE_URL no .env (ver .env.example) antes de produção.',
  );
}

const resolvedConnectionString =
  connectionString ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/ai_commerce';

const client = postgres(resolvedConnectionString);
export const db = drizzle(client, { schema });
