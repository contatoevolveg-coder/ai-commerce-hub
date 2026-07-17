# PROMPT F9 — Relatórios automáticos + Hardening + LGPD

> Cole no Antigravity depois de colar o bloco do `ANTIGRAVITY_RULES.md` e depois do F7 (ou F8, se
> já tiver rodado) pronto/auditado. É a última fase do roadmap atual. Branch nasce de `main`.

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin main` e `git log origin/main --oneline -15`. Confirme que seu branch nasce
   do commit mais recente. Sem acesso a fetch: pergunte qual é o commit de referência antes de
   tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md` (leia **até o fim** — os Incidentes 1 a 5 são
   exatamente a matéria-prima do checklist de hardening desta fase, não são histórico morto),
   `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`, `./ROADMAP.md` (seção F9 e a tabela "Segurança —
   o que já ancora e o que falta" — está desatualizada em alguns pontos, ver abaixo).

## Correções ao que o `ROADMAP.md` ainda descreve como pendente (já não é)

A tabela de segurança do `ROADMAP.md` pode listar como `❌` itens que **já foram entregues**:
- Cripto AES-256-GCM das credenciais → ✅ pronta e testada com chave real em produção
  (`packages/core/src/crypto/credencial.ts`, `integracoes.service.ts`).
- Auth.js + RBAC → ✅ pronto e em produção (`apps/web/auth.ts`, `middleware.ts`,
  `app/(auth)/actions.ts` — login, cadastro, sessão por tenant).
- Zod na fronteira HTTP → ✅ nas rotas de ERP/integrações pelo menos (`bodySchema` em
  `apps/web/app/api/integracoes/erp/route.ts`) — confirme cobertura nas demais rotas de
  `apps/web/app/api/*` como parte do checklist abaixo, não assuma que falta tudo.

Isso muda o ponto de partida: esta fase é **hardening de cima do que já existe e funciona**, não
implementação do zero.

## Escopo — não superdimensione o tempo aqui, boa parte é documentação/agregação, não motor novo

1. **Relatórios automáticos**: reaproveita os motores de F7 (estoque/margem, se já implementados)
   para gerar snapshot periódico — agregação + apresentação do que já existe, não cálculo novo.

2. **Monitoramento de saúde dos conectores**: status de última sincronização por `canal`
   (`produto_espelho.ultimaSincronizacao` já existe no schema) — tela ou seção, não infra nova.
   Se o worker de sync-ERP da F6 já roda, esta seção mostra o resultado real dele, não um mock.

3. **Hardening** (checklist, majoritariamente não é código novo):
   - Revise **todas** as policies de RLS (`tenantIsolationPolicy`/`FORCE ROW LEVEL SECURITY`) —
     `grep -r "FORCE ROW LEVEL SECURITY" packages/db/drizzle/*.sql` para a lista completa de
     tabelas que precisam de policy. Confirme que nenhuma tabela de negócio nova (`conexao_erp`,
     `tarefa`, `regra_preco`, adicionadas depois do M1 original) ficou sem isolamento.
   - **Revise especificamente o mecanismo de conexão em produção** (Incidente 5 do
     `HISTORICO_PROJETO.md`): a app conecta como `postgres` via pooler e faz
     `SET LOCAL ROLE app_role` dentro de `withTenant` para restaurar o RLS. Confirme que **toda**
     query de negócio passa por `withTenant` (grep por `import { db }` fora de `tenant-context.ts`
     em código de aplicação/serviço — uso direto de `db.select/insert` fora de `withTenant` numa
     tabela com RLS forçado silenciosamente ignora o isolamento, porque roda como `postgres`).
   - **Rotação de senha pendente**: a senha do `app_role` e a do `postgres` foram alteradas
     durante o diagnóstico ao vivo de um incidente de produção (passaram por chat/terminal em
     texto). Rotacione ambas de novo agora, por precaução, e documente o procedimento de rotação
     (via painel do Supabase para `postgres`; via `ALTER ROLE app_role WITH PASSWORD` para
     `app_role`) para que a próxima rotação não dependa de abrir o SQL Editor manualmente.
   - Documente o procedimento de rotação de `CREDENTIAL_ENCRYPTION_KEY` (não precisa automação
     hoje) — inclua o passo "atualizar em AMBOS os projetos Vercel + fazer push de diff real para
     forçar rebuild" (commit vazio é ignorado pelo build-skip da Vercel, já documentado como
     Incidentes 3/4).
   - Headers de segurança no `apps/web/next.config.mjs` (arquivo já existe — edite, não recrie):
     CSP, HSTS, X-Frame-Options.
   - Remova qualquer endpoint de diagnóstico temporário que tenha sobrado no repositório
     (`grep -r "DIAGNÓSTICO TEMPORÁRIO"` ou similar em `apps/web/app/api/`) — foram usados para
     depurar incidentes de produção e não devem ficar expostos publicamente.

4. **LGPD**: para um MVP em pré-produção, isto é principalmente documentação (política de
   retenção) + um endpoint de exclusão de dados de um `cliente` sob pedido. Não construa um
   sistema de compliance completo — o essencial é existir o mecanismo e a nota de retenção.

## DoD

```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Verde para o monorepo inteiro, incluindo `apps/worker` se a F6 já tiver sido implantada.

## Ao concluir

Esta é a última fase do roadmap atual — **atualize `ROADMAP.md`** com o estado real final
(percentual honesto, não arredondado pra cima — o estado real hoje já está bem acima do que a
tabela atual do `ROADMAP.md` mostra, corrija a tabela inteira, não só acrescente uma linha) e
**atualize `HISTORICO_PROJETO.md`** com uma seção final resumindo o que fica pronto e o que
continua como trabalho futuro (worker em produção contínua, adapters de outros marketplaces,
motores de concorrência/Smart Pricing).

## Fluxo obrigatório

1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f9-relatorios-hardening`, a partir de `main`.
3. **Não commite** — chame o Claude Code para auditar antes do commit/PR.
4. Ambiguidade de regra de negócio ou de compliance: pare e pergunte, não invente.
