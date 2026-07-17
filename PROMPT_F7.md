# PROMPT F7 — Motores de valor (estoque, dry-run, concorrência)

> Cole no Antigravity depois de colar o bloco do `ANTIGRAVITY_RULES.md` e depois do F6
> pronto/auditado. Branch nasce de `main` (todo o histórico de fases F3–F6 já está mergeado lá —
> não existe mais uma cadeia de branches `feat/f5-...`/`feat/f6-...` em aberto esperando merge).

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin main` e `git log origin/main --oneline -15`. Confirme que seu branch nasce
   do commit mais recente. Sem acesso a fetch: pergunte qual é o commit de referência antes de
   tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md` (leia até o fim — 5 incidentes documentados),
   `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`, `./ROADMAP.md`.
2. `.agents/skills/marketplace-domain/SKILL.md` — vocabulário do domínio (curva ABC, sales
   velocity, cobertura em dias) já especificado ali. Não invente definição própria de "ruptura"
   ou "giro" — use a da skill.
3. `packages/core/src/decisions/maquina-estados.ts` e `guardrails.ts` (F5.3, **já implementados e
   testados em produção**, não são só schema) — o modo sandbox/dry-run desta fase é um parâmetro
   a mais nessa máquina de estados já real, não um motor novo do zero.
4. `packages/core/src/pricing/calcularMargem.ts` — motor de preço/margem completo, 93%+ cobertura,
   já retorna `precoPisoCentavos`. Qualquer cálculo de margem aqui reusa isso, não recalcula.

## Resumo do que já existe (contexto que muda o ponto de partida desta fase)

Diferente do que um prompt genérico assumiria, hoje o projeto já tem: RLS multi-tenant validado
em produção real, Auth.js + RBAC completo, motor de decisão IA com guardrails de hard-stop (preço-
piso, atacado, variação 24h, kill switch por cliente), Governance Center funcional (`/governanca`,
aprovar/rejeitar tarefas), cofre de credenciais ERP cifrado (AES-256-GCM, testado com chave real),
e um worker (`apps/worker/`) que já roda diagnóstico de produto via LLM real (gpt-4o-mini) e grava
decisões de verdade. **Nada disso precisa ser refeito aqui** — os motores desta fase (estoque,
dry-run) se encaixam nessa base já sólida.

## Escopo — priorize nesta ordem se o tempo apertar

1. **Motor de estoque** (maior valor imediato): ruptura (estoque abaixo de X dias de cobertura),
   giro, cobertura em dias. Cálculo puro em `packages/core/src/estoque/`, testado, sem lógica em
   componente React (regra 9 AGENTS.md). Consome as tabelas `estoque`/`movimento_estoque`
   (já existem no schema, `packages/db/src/schema/produto.ts` — confirme o shape exato lendo o
   arquivo antes de escrever a query).

2. **Modo sandbox/dry-run** (pedido do PO): toda ação sensível do motor de decisão (F5.3, já
   implementado) pode rodar em modo simulação — calcula e mostra o resultado, gera `Decisao` com
   estado `proposed`, mas nunca chega a `executing` a menos que o dry-run seja desligado
   explicitamente. Isto é quase grátis porque o F5.3 já existe de verdade — é um parâmetro a mais
   em `transitarDecisao`/`aplicarGuardrails`, não um motor novo. Leia
   `packages/core/src/decisions/maquina-estados.ts` inteiro antes de adicionar o parâmetro, para
   não quebrar o comportamento já testado (regra 15 do `ANTIGRAVITY_RULES.md` — preservar
   comportamento existente numa reescrita).

3. **Análise de concorrência / Smart Pricing / Product 360°**: dependem de dado de concorrente
   que nenhum adapter deste projeto coleta ainda. **Se chegar aqui, PARE e pergunte antes de
   inventar uma fonte de dado fake para "concorrente"** — isso é exatamente o tipo de ambiguidade
   de regra de negócio que o AGENTS.md pede pra não resolver sozinho.

## DoD

```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Verde para o que foi implementado. Se só o item 1 (estoque) fechar, tudo bem — documente em
`task.md` o que ficou de fora, e se o item 2 (dry-run) foi ou não implementado.

## Fluxo obrigatório

1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f7-motores-valor`, a partir de `main`.
3. **Não commite** — DoD verde, chame o Claude Code para auditar antes do commit/PR.
4. Ambiguidade de regra de negócio: pare e pergunte, especialmente no item 3.
