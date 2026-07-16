# PROMPT F9 — Relatórios automáticos + Hardening + LGPD

> Cole no Antigravity depois do F7 (ou F8, se já tiver rodado) pronto/auditado. É a última fase
> do roadmap atual. Branch nasce da última fase concluída — confirme qual antes de começar.

---

## BLOCO 0 — Sincronização e leitura

0. `git fetch origin <branch-da-ultima-fase>` e confirme que seu branch nasce dali.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md`, `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`,
   `./ROADMAP.md` (seção F9, e a tabela "Segurança — o que já ancora e o que falta").

## Escopo — não superdimensione o tempo aqui, boa parte é documentação/agregação, não motor novo

1. **Relatórios automáticos**: reaproveita os motores de F7 (estoque/margem) para gerar
   snapshot periódico — agregação + apresentação do que já existe, não cálculo novo.

2. **Monitoramento de saúde dos conectores**: status de última sincronização por `canal`
   (`produto_espelho.ultimaSincronizacao` já existe no schema) — tela ou seção, não infra nova.

3. **Hardening** (checklist, majoritariamente não é código novo):
   - Revise todas as policies de RLS (`tenantIsolationPolicy`) — confirme que nenhuma tabela de
     negócio ficou sem ela. Use `packages/db/src/schema/index.ts` como lista mestra de tabelas.
   - Documente o procedimento de rotação de `CREDENTIAL_ENCRYPTION_KEY` (não precisa automação).
   - Headers de segurança no `apps/web/next.config.mjs` (arquivo já existe — edite, não recrie):
     CSP, HSTS, X-Frame-Options.

4. **LGPD**: para um MVP em pré-produção, isto é principalmente documentação (política de
   retenção) + um endpoint de exclusão de dados de um `cliente` sob pedido. Não construa um
   sistema de compliance completo — o essencial é existir o mecanismo e a nota de retenção.

## DoD
Padrão do monorepo (`pnpm typecheck && lint && test && build`) verde para o que foi implementado.

## Ao concluir
Esta é a última fase do roadmap atual — **atualize `ROADMAP.md`** com o estado real final
(percentual honesto, não arredondado pra cima) e me avise: aí sim entramos na etapa de mergear
a pilha inteira (F5.1 → F5.2 → F5.3 → F6 → F7 → [F8] → F9 → `main`) e disparar o deploy.

## Fluxo obrigatório
1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f9-relatorios-hardening`.
3. **Não commite** — me chame para auditar antes do commit/PR.
4. Ambiguidade de regra de negócio ou de compliance: pare e pergunte, não invente.
