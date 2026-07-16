CREATE TYPE "public"."tarefa_status" AS ENUM('aberta', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."tarefa_tipo" AS ENUM('aprovacao_decisao', 'diagnostico_cadastro', 'divergencia_estoque', 'outro');--> statement-breakpoint
CREATE TABLE "regra_preco" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"canal_id" uuid,
	"categoria" text,
	"margem_minima_bps" bigint NOT NULL,
	"desconto_maximo_bps" bigint NOT NULL,
	"vigente_de" timestamp with time zone NOT NULL,
	"vigente_ate" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "regra_preco" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tarefa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" "tarefa_tipo" NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"decisao_id" uuid,
	"responsavel_id" uuid,
	"prazo" timestamp with time zone,
	"status" "tarefa_status" DEFAULT 'aberta' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tarefa" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "regra_preco" ADD CONSTRAINT "regra_preco_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regra_preco" ADD CONSTRAINT "regra_preco_canal_id_canal_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_decisao_id_decisao_id_fk" FOREIGN KEY ("decisao_id") REFERENCES "public"."decisao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarefa" ADD CONSTRAINT "tarefa_responsavel_id_usuario_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "regra_preco_tenant_isolation" ON "regra_preco" AS PERMISSIVE FOR ALL TO public USING (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid) WITH CHECK (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tarefa_tenant_isolation" ON "tarefa" AS PERMISSIVE FOR ALL TO public USING (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid) WITH CHECK (cliente_id = nullif(current_setting('app.current_cliente_id', true), '')::uuid);