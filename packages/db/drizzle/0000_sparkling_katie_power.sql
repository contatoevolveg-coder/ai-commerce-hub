CREATE TYPE "public"."canal_status" AS ENUM('ativo', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."canal_tipo" AS ENUM('mercado_livre', 'amazon', 'shopee', 'magalu', 'tiktok_shop', 'shein', 'loja_propria');--> statement-breakpoint
CREATE TYPE "public"."credencial_tipo" AS ENUM('oauth', 'api_key');--> statement-breakpoint
CREATE TYPE "public"."estado_decisao" AS ENUM('proposed', 'auto_approved', 'pending_review', 'approved', 'rejected', 'executing', 'executed', 'failed', 'retry', 'dead_letter', 'rollback');--> statement-breakpoint
CREATE TYPE "public"."papel_codigo" AS ENUM('admin', 'pricing', 'atendimento', 'auditor');--> statement-breakpoint
CREATE TYPE "public"."regime_tributario" AS ENUM('simples', 'lucro_presumido', 'lucro_real');--> statement-breakpoint
CREATE TYPE "public"."status_execucao_agente" AS ENUM('executando', 'concluido', 'falhou');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('novo', 'pago', 'enviado', 'entregue', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_agente" AS ENUM('pricing', 'estoque', 'atendimento', 'conteudo', 'fraude');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimento_estoque" AS ENUM('entrada', 'saida', 'ajuste', 'reserva');--> statement-breakpoint
CREATE TYPE "public"."tipo_tarifa" AS ENUM('percentual', 'fixo', 'matriz');--> statement-breakpoint
CREATE TABLE "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text,
	"regime_tributario" "regime_tributario" DEFAULT 'simples' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cliente" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "papel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" "papel_codigo" NOT NULL,
	"descricao" text NOT NULL,
	CONSTRAINT "papel_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "sessao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"ip" text,
	"user_agent" text,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sessao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"papel_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "canal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tipo" "canal_tipo" NOT NULL,
	"nome" text NOT NULL,
	"status" "canal_status" DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "canal_tarifa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"canal_id" uuid NOT NULL,
	"categoria" text NOT NULL,
	"tipo" "tipo_tarifa" NOT NULL,
	"valor_bps" bigint,
	"valor_centavos" bigint,
	"matriz" jsonb,
	"vigente_de" timestamp with time zone NOT NULL,
	"vigente_ate" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canal_tarifa" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "credencial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"canal_id" uuid NOT NULL,
	"tipo" "credencial_tipo" NOT NULL,
	"payload_cifrado" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credencial" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "estoque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade_disponivel" integer DEFAULT 0 NOT NULL,
	"quantidade_reservada" integer DEFAULT 0 NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "estoque" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "movimento_estoque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"tipo" "tipo_movimento_estoque" NOT NULL,
	"quantidade" integer NOT NULL,
	"motivo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimento_estoque" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "produto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"nome" text NOT NULL,
	"categoria" text NOT NULL,
	"cmv_centavos" bigint NOT NULL,
	"peso_gramas" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produto" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "produto_espelho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"canal_id" uuid NOT NULL,
	"sku_remoto" text NOT NULL,
	"preco_remoto_centavos" bigint,
	"estoque_remoto" integer,
	"status_remoto" text,
	"divergente" boolean DEFAULT false NOT NULL,
	"ultima_sincronizacao" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produto_espelho" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "comprador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text,
	"documento" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comprador" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unitario_centavos" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "item_pedido" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pedido" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"canal_id" uuid NOT NULL,
	"comprador_id" uuid,
	"numero_pedido_remoto" text NOT NULL,
	"status" "status_pedido" DEFAULT 'novo' NOT NULL,
	"total_centavos" bigint NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pedido" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "agente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" "tipo_agente" NOT NULL,
	"nivel_autonomia" smallint DEFAULT 1 NOT NULL,
	"versao_prompt" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agente" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"ator" text NOT NULL,
	"acao" text NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" text,
	"valor_anterior" jsonb,
	"valor_novo" jsonb,
	"ip" text,
	"user_agent" text,
	"motivo" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consumo_ia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"agente_id" uuid,
	"mes_referencia" text NOT NULL,
	"tokens_in" bigint DEFAULT 0 NOT NULL,
	"tokens_out" bigint DEFAULT 0 NOT NULL,
	"custo_centavos" bigint DEFAULT 0 NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consumo_ia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "decisao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"agente_id" uuid NOT NULL,
	"execucao_id" uuid,
	"versao_prompt" text NOT NULL,
	"modelo" text NOT NULL,
	"input_hash" text NOT NULL,
	"proposta" jsonb NOT NULL,
	"raciocinio" text NOT NULL,
	"impacto_estimado_centavos" bigint NOT NULL,
	"confianca" smallint NOT NULL,
	"tokens_in" integer DEFAULT 0 NOT NULL,
	"tokens_out" integer DEFAULT 0 NOT NULL,
	"custo_centavos" bigint DEFAULT 0 NOT NULL,
	"estado" "estado_decisao" DEFAULT 'proposed' NOT NULL,
	"ator_aprovador" uuid,
	"estado_anterior_json" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decisao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "execucao_agente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"agente_id" uuid NOT NULL,
	"status" "status_execucao_agente" DEFAULT 'executando' NOT NULL,
	"contexto" jsonb,
	"iniciado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"finalizado_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "execucao_agente" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "automacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"gatilho" text NOT NULL,
	"condicoes" jsonb,
	"acoes" jsonb,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "automacao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notificacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cliente_id" uuid NOT NULL,
	"usuario_id" uuid,
	"tipo" text NOT NULL,
	"titulo" text NOT NULL,
	"mensagem" text NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notificacao" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_papel_id_papel_id_fk" FOREIGN KEY ("papel_id") REFERENCES "public"."papel"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canal" ADD CONSTRAINT "canal_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canal_tarifa" ADD CONSTRAINT "canal_tarifa_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canal_tarifa" ADD CONSTRAINT "canal_tarifa_canal_id_canal_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credencial" ADD CONSTRAINT "credencial_canal_id_canal_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_estoque" ADD CONSTRAINT "movimento_estoque_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_estoque" ADD CONSTRAINT "movimento_estoque_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto" ADD CONSTRAINT "produto_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_espelho" ADD CONSTRAINT "produto_espelho_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_espelho" ADD CONSTRAINT "produto_espelho_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produto_espelho" ADD CONSTRAINT "produto_espelho_canal_id_canal_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comprador" ADD CONSTRAINT "comprador_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_pedido_id_pedido_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedido"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_pedido" ADD CONSTRAINT "item_pedido_produto_id_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_canal_id_canal_id_fk" FOREIGN KEY ("canal_id") REFERENCES "public"."canal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_comprador_id_comprador_id_fk" FOREIGN KEY ("comprador_id") REFERENCES "public"."comprador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agente" ADD CONSTRAINT "agente_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumo_ia" ADD CONSTRAINT "consumo_ia_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumo_ia" ADD CONSTRAINT "consumo_ia_agente_id_agente_id_fk" FOREIGN KEY ("agente_id") REFERENCES "public"."agente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisao" ADD CONSTRAINT "decisao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisao" ADD CONSTRAINT "decisao_agente_id_agente_id_fk" FOREIGN KEY ("agente_id") REFERENCES "public"."agente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisao" ADD CONSTRAINT "decisao_execucao_id_execucao_agente_id_fk" FOREIGN KEY ("execucao_id") REFERENCES "public"."execucao_agente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisao" ADD CONSTRAINT "decisao_ator_aprovador_usuario_id_fk" FOREIGN KEY ("ator_aprovador") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execucao_agente" ADD CONSTRAINT "execucao_agente_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execucao_agente" ADD CONSTRAINT "execucao_agente_agente_id_agente_id_fk" FOREIGN KEY ("agente_id") REFERENCES "public"."agente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automacao" ADD CONSTRAINT "automacao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usuario_cliente_email_idx" ON "usuario" USING btree ("cliente_id","email");--> statement-breakpoint
CREATE INDEX "canal_tarifa_lookup_idx" ON "canal_tarifa" USING btree ("canal_id","categoria","vigente_de");--> statement-breakpoint
CREATE UNIQUE INDEX "estoque_produto_idx" ON "estoque" USING btree ("produto_id");--> statement-breakpoint
CREATE UNIQUE INDEX "produto_cliente_sku_idx" ON "produto" USING btree ("cliente_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "produto_espelho_produto_canal_idx" ON "produto_espelho" USING btree ("produto_id","canal_id");--> statement-breakpoint
CREATE POLICY "cliente_self_isolation" ON "cliente" AS PERMISSIVE FOR ALL TO public USING (id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "sessao_tenant_isolation" ON "sessao" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "usuario_tenant_isolation" ON "usuario" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "canal_tenant_isolation" ON "canal" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "canal_tarifa_tenant_isolation" ON "canal_tarifa" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "credencial_tenant_isolation" ON "credencial" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "estoque_tenant_isolation" ON "estoque" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "movimento_estoque_tenant_isolation" ON "movimento_estoque" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "produto_tenant_isolation" ON "produto" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "produto_espelho_tenant_isolation" ON "produto_espelho" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "comprador_tenant_isolation" ON "comprador" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "item_pedido_tenant_isolation" ON "item_pedido" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "pedido_tenant_isolation" ON "pedido" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "agente_tenant_isolation" ON "agente" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "audit_log_tenant_isolation" ON "audit_log" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "consumo_ia_tenant_isolation" ON "consumo_ia" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "decisao_tenant_isolation" ON "decisao" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "execucao_agente_tenant_isolation" ON "execucao_agente" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "automacao_tenant_isolation" ON "automacao" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "notificacao_tenant_isolation" ON "notificacao" AS PERMISSIVE FOR ALL TO public USING (cliente_id = current_setting('app.current_cliente_id', true)::uuid) WITH CHECK (cliente_id = current_setting('app.current_cliente_id', true)::uuid);