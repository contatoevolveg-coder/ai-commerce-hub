-- Cria uma role de aplicação NÃO-superusuário. Isto é essencial: no Postgres,
-- superusuários e o dono da tabela SEMPRE ignoram RLS (mesmo com FORCE ROW LEVEL
-- SECURITY), então se a aplicação continuar conectando como "postgres" (dono das
-- tabelas, superusuário no docker-compose local), todo o isolamento de tenant que
-- acabamos de configurar seria ignorado silenciosamente. app_role é dona de nada,
-- só recebe GRANT — por isso RLS se aplica a ela incondicionalmente.
--
-- Local/dev: a senha abaixo é um placeholder — troque antes de qualquer ambiente
-- que não seja a sua máquina. Configure APP_DATABASE_URL no seu .env com estas
-- credenciais (ver .env.example). Migrations continuam rodando via DATABASE_URL
-- (role privilegiada), só a query runtime da aplicação usa app_role.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role LOGIN PASSWORD 'app_role_local_dev_only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO app_role;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;--> statement-breakpoint
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_role;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO app_role;--> statement-breakpoint

-- audit_log é append-only mesmo para quem tem UPDATE/DELETE via GRANT — o
-- trigger (migration 0001) bloqueia no nível de operação, então o GRANT amplo
-- acima não reabre a brecha; mantemos assim para simplicidade de administração.
