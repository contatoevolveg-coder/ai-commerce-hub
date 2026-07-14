-- FORCE ROW LEVEL SECURITY: por padrão, o Postgres NÃO aplica RLS ao dono da
-- tabela (a role de conexão da própria aplicação, que criou as tabelas via
-- migration). ENABLE ROW LEVEL SECURITY sozinho não é suficiente — sem FORCE,
-- a aplicação bypassaria silenciosamente o isolamento de tenant que acabamos
-- de criar. Ver AGENTS.md regra 3.
ALTER TABLE "cliente" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessao" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usuario" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "canal" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "canal_tarifa" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credencial" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "estoque" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "movimento_estoque" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "produto" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "produto_espelho" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comprador" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_pedido" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pedido" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agente" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_log" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consumo_ia" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "decisao" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "execucao_agente" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "automacao" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notificacao" FORCE ROW LEVEL SECURITY;--> statement-breakpoint

-- audit_log é append-only por design (AGENTS.md regra 6): sem UPDATE, sem DELETE.
-- RLS isola por tenant, mas não impede um tenant de alterar/apagar a própria
-- linha — quem garante isso é este trigger, direto no banco.
CREATE OR REPLACE FUNCTION audit_log_bloquear_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log é append-only: % não é permitido', TG_OP;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_bloquear_update_delete();--> statement-breakpoint
