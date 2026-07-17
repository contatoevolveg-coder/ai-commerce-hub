-- ============================================================================
-- BOOTSTRAP SUPABASE (rodar UMA vez por projeto Supabase novo, no SQL Editor)
-- ============================================================================
--
-- Contexto: o pooler do Supabase (Supavisor, porta 6543) só reconhece o usuário
-- `postgres` — conexões como `app_role.<ref>` falham com "Tenant or user not
-- found". Mas `postgres` tem BYPASSRLS, o que anularia o isolamento multi-tenant
-- se a aplicação consultasse dados de negócio direto como postgres.
--
-- Solução: a aplicação conecta como `postgres` (via pooler) e faz
-- `SET LOCAL ROLE app_role` dentro de cada transação de tenant (ver
-- packages/db/src/tenant-context.ts → withTenant). Isso descarta o BYPASSRLS
-- pela duração da transação e o RLS volta a valer. Para o `SET ROLE` ser
-- permitido, `postgres` precisa ser MEMBRO de `app_role` — é o que este script faz.
--
-- Pré-requisito: as migrations drizzle já rodaram (incl. 0002, que cria app_role).
-- Em produção, defina APP_DATABASE_URL = a MESMA string do DATABASE_URL (ambos
-- conectam como postgres pelo pooler); o RLS é garantido pelo SET LOCAL ROLE.
-- ----------------------------------------------------------------------------

-- 1. Garante que a senha do app_role não é o placeholder de dev (troque o valor).
--    (Opcional em produção via pooler, já que a app conecta como postgres, mas
--     mantém app_role utilizável para conexão direta/debug.)
-- ALTER ROLE app_role WITH PASSWORD 'DEFINA_UMA_SENHA_FORTE_AQUI';

-- 2. Permite que postgres troque para app_role dentro das transações de tenant.
GRANT app_role TO postgres;
