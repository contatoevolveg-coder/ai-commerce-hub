# PROMPT F6 — Worker de agentes (BullMQ/Redis)

> Cole no Antigravity depois do F5.3 pronto/auditado. Branch nasce de `feat/f5-3-motor-decisao`.
> **Esta fase mexe em infraestrutura nova (processo separado, fila, Redis) — é onde erro
> silencioso é mais caro. Avance com mais cautela que nas fases anteriores.**

---

## BLOCO 0 — Sincronização e leitura

0. `git fetch origin feat/f5-3-motor-decisao` e confirme que seu branch nasce dali. Sem acesso a
   fetch: pergunte qual é o commit de referência antes de tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md`, `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`,
   `./ROADMAP.md` (seção F6).
2. `packages/integrations/src/registry.ts` e `contracts/*.ts` (F4.1) — `getErpAdapter`,
   `getMarketplaceAdapter`, ainda mock.
3. `packages/core/src/decisions/` (F5.3) — máquina de estados e guardrails que todo agente deve
   passar antes de qualquer execução.

## Resumo do que já existe
Contratos + mocks de integração prontos (Bling ERP, Mercado Livre) desde F4.1. Motor de decisão
com guardrails desde F5.3. **Nenhum worker/fila existe ainda** — hoje tudo roda síncrono dentro
de Server Components/rotas do `apps/web`.

## Escopo

1. `apps/worker/` — app novo no monorepo (não pacote): `package.json` próprio com BullMQ +
   ioredis. **Antes de rodar `pnpm add`, confirme se essas libs já aparecem em algum
   `package.json`/`pnpm-lock.yaml` do monorepo** (o `AGENTS.md` já cita Redis/BullMQ na stack) —
   se sim, use a mesma versão; se não, proponha e espere aprovação (regra do AGENTS.md).

2. Orquestrador mínimo: um job type por agente (`sync-bling`, `sync-mercadolivre`). Cada job:
   - Lê `agente` (tabela) do cliente.
   - Chama `getErpAdapter`/`getMarketplaceAdapter` (mock).
   - Persiste em `produto`/`estoque`/`produto_espelho` via `withTenant` (nunca grava direto sem
     passar pela máquina de estados do F5.3 quando a ação envolver preço).
   - Gera `execucao_agente` + `decisao` quando aplicável.

3. Idempotência: chave = SHA-256 do payload canônico do job (regra 7 AGENTS.md). Reprocessar o
   mesmo job não duplica `produto`/`pedido`.

4. Kill switch global (F5.3) checado pelo worker antes de qualquer execução autônoma.

## O que esta fase NÃO inclui
- Scheduler de produção (cron real) — o job precisa ser re-executável manualmente pra provar o
  pipeline fim-a-fim, não precisa rodar sozinho a cada 15-30min ainda.
- Adapter real do Bling/ML — continua mock.

## Se não fechar no tempo disponível
Documente em `task.md` exatamente até onde o worker roda localmente (contra Redis local/docker)
e o que falta pra virar produção — não deixe isso implícito.

## DoD
Rodar o worker manualmente uma vez, ponta a ponta, contra os mocks do F4.1, e provar via query no
banco que os dados chegaram (screenshot ou output colado). Mais:
```
pnpm typecheck && pnpm lint && pnpm test
```
(`pnpm build` só se `apps/worker` tiver um script de build — confirme antes de assumir que existe.)

## Fluxo obrigatório
1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f6-worker-agentes`, a partir de `feat/f5-3-motor-decisao`.
3. **Não commite** — me chame para auditar antes do commit/PR.
4. Ambiguidade de regra de negócio ou de infraestrutura (ex. onde roda o Redis em produção):
   pare e pergunte.
