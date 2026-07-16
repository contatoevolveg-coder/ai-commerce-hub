# PROMPT F7 — Motores de valor (estoque, concorrência, Smart Pricing, Product 360°)

> Cole no Antigravity depois do F6 pronto/auditado. Branch nasce de `feat/f6-worker-agentes`.

---

## BLOCO 0 — Sincronização e leitura

0. `git fetch origin feat/f6-worker-agentes` e confirme que seu branch nasce dali. Sem acesso a
   fetch: pergunte qual é o commit de referência antes de tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md`, `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`,
   `./ROADMAP.md` (seção F7).
2. `packages/core/src/decisions/` (F5.3) — o modo sandbox/dry-run desta fase é um parâmetro a
   mais na máquina de estados existente, não um motor novo.

## Escopo — priorize nesta ordem se o tempo apertar

1. **Motor de estoque** (maior valor imediato): ruptura (estoque abaixo de X dias de cobertura),
   giro, cobertura em dias. Cálculo puro em `packages/core/src/estoque/`, testado, sem lógica em
   componente React (regra 9 AGENTS.md). Vocabulário do domínio: ver
   `.agents/skills/marketplace-domain/SKILL.md` (curva ABC, sales velocity, cobertura em dias).

2. **Modo sandbox/dry-run** (pedido do PO): toda ação sensível do motor de decisão (F5.3) pode
   rodar em modo simulação — calcula e mostra o resultado, gera `Decisao` com estado `proposed`,
   mas nunca chega a `executing` a menos que o dry-run seja desligado explicitamente. Isto é
   quase grátis se o F5.3 foi bem implementado — é um parâmetro a mais, não um motor novo.

3. **Análise de concorrência / Smart Pricing / Product 360°**: dependem de dado de concorrente
   que nenhum adapter deste projeto coleta ainda. **Se chegar aqui, PARE e pergunte antes de
   inventar uma fonte de dado fake para "concorrente"** — isso é exatamente o tipo de ambiguidade
   de regra de negócio que o AGENTS.md pede pra não resolver sozinho.

## DoD
Padrão do monorepo (`pnpm typecheck && lint && test && build`) verde para o que foi implementado.
Se só o item 1 (estoque) fechar, tudo bem — documente em `task.md` o que ficou de fora.

## Fluxo obrigatório
1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f7-motores-valor`, a partir de `feat/f6-worker-agentes`.
3. **Não commite** — me chame para auditar antes do commit/PR.
4. Ambiguidade de regra de negócio: pare e pergunte, especialmente no item 3.
