CREATE TABLE "token_oauth" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"conexao_erp_id" uuid NOT NULL,
	"payload_cifrado" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "token_oauth" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "token_oauth" ADD CONSTRAINT "token_oauth_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_oauth" ADD CONSTRAINT "token_oauth_conexao_erp_id_conexao_erp_id_fk" FOREIGN KEY ("conexao_erp_id") REFERENCES "public"."conexao_erp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "token_oauth_conexao_idx" ON "token_oauth" USING btree ("conexao_erp_id");--> statement-breakpoint
CREATE POLICY "token_oauth_tenant_isolation" ON "token_oauth" AS PERMISSIVE FOR ALL TO public USING (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid) WITH CHECK (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid);--> statement-breakpoint

-- Reforço de segurança (mesma disciplina das tabelas do M1, migration 0001):
-- FORCE ROW LEVEL SECURITY garante que o RLS valha mesmo para o dono da tabela.
-- token_oauth e conexao_erp guardam segredos (tokens/credenciais cifradas), então
-- recebem FORCE explicitamente (as demais tabelas pós-M1 herdam só ENABLE).
ALTER TABLE "token_oauth" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conexao_erp" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- GRANT explícito ao app_role (não confiar só no ALTER DEFAULT PRIVILEGES da 0002):
-- a role de aplicação (não-superusuário, usada via SET LOCAL ROLE) precisa de DML
-- nesta tabela para o fluxo OAuth funcionar sob RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON "token_oauth" TO app_role;