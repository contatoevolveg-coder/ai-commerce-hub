CREATE TYPE "public"."conexao_erp_status" AS ENUM('conectado', 'desconectado', 'erro');--> statement-breakpoint
CREATE TYPE "public"."erp_tipo" AS ENUM('bling', 'tiny', 'outro');--> statement-breakpoint
CREATE TABLE "conexao_erp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"erp" "erp_tipo" NOT NULL,
	"rotulo" text NOT NULL,
	"status" "conexao_erp_status" DEFAULT 'desconectado' NOT NULL,
	"payload_cifrado" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conexao_erp" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "conexao_erp" ADD CONSTRAINT "conexao_erp_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "conexao_erp_cliente_erp_idx" ON "conexao_erp" USING btree ("cliente_id","erp");--> statement-breakpoint
CREATE POLICY "conexao_erp_tenant_isolation" ON "conexao_erp" AS PERMISSIVE FOR ALL TO public USING (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid) WITH CHECK (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid);