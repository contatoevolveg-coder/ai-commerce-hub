# PROMPT F5.3 — Motor de decisão (M3) + guardrails

> Cole no Antigravity **depois** que o F5.2 estiver pronto e auditado. Branch nasce de
> `feat/f5-2-governanca` (não `main` — merges ficam pra um lote só no final, por decisão do
> usuário).

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin feat/f5-2-governanca` e confirme que seu branch nasce dali. Sem acesso a
   fetch: pergunte explicitamente qual é o commit de referência antes de tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md`, `./ANTIGRAVITY_RULES.md` (regras 15 e 16),
   `./GUARDRAILS.md`, `./ROADMAP.md` (seção F5.3).
2. `.agents/skills/ai-decisions/SKILL.md` — a especificação **inteira** já existe (máquina de
   estados, níveis de autonomia 1–5, guardrails hard-stop, campos obrigatórios de `Decisao`).
   **Implemente exatamente o que está descrito ali — não reinvente.**
3. `packages/core/src/pricing/calcularMargem.ts` — já retorna `precoPisoCentavos` (busca binária
   pronta e testada). O guardrail de preço-piso desta fase é **reuso direto**, não recálculo.

## Resumo do que já existe
Schema `decisao`/`agente`/`estadoDecisaoEnum` (`packages/db/src/schema/ia.ts`) com a máquina de
estados completa no enum. F5.2 adicionou `tarefa`/`regra_preco` e o Governance Center
(`/governanca`), com `aprovarTarefa`/`rejeitarTarefa` em `packages/core/src/services/governanca.service.ts`
transicionando `decisao.estado` de forma simplificada — **esta fase substitui essa transição
simplificada pela máquina de estados de verdade**, não por uma segunda implementação paralela.

## Escopo

1. `packages/core/src/decisions/maquina-estados.ts`: transições válidas exatamente como na skill
   (`proposed → auto_approved | pending_review → approved → executing → executed`, ramos
   `rejected`/`failed → retry | dead_letter`/`rollback`). Transição inválida lança erro explícito.

2. `packages/core/src/decisions/guardrails.ts`:
   - Preço proposto < `precoPisoCentavos` (via `calcularMargem`) → hard stop, nunca chega a
     `auto_approved`.
   - Preço atacado > 97% do preço varejo → hard stop.
   - Variação de preço > 15% em 24h no mesmo SKU (consulta decisões/produto_espelho recentes) →
     força `pending_review`, mesmo em autonomia nível 5.
   - Kill switch: flag `ai_execution_enabled` por cliente. Decida o menor shape (coluna nova em
     `cliente` vs. tabela `configuracao`) e **documente a escolha no `implementation_plan.md`**
     antes de codar — isso é ambíguo o suficiente pra merecer registro, não pra parar e perguntar.
   - Limite de impacto financeiro por nível de autonomia do agente (1: só sugere · 2: até R$100
     · 3: até R$500 · 4: até R$2.000 · 5: sem limite de valor, mas sob os hard stops acima).

3. Toda transição grava `audit_log` (ator, payload, motivo — regra 6 AGENTS.md).

4. Rollback: nova `Decisao` tipo rollback referenciando a original via `estado_anterior_json`
   (coluna já existe em `decisao`) — nunca `UPDATE` destrutivo.

5. Atualize `governanca.service.ts` (F5.2) pra chamar esta máquina de estados em vez da lógica
   simplificada anterior — isso é uma reescrita de arquivo existente, siga a regra 15 do
   `ANTIGRAVITY_RULES.md` (preserve o que já funciona: verificação de papel `auditor`).

## Testes (não aceite menos que isso coberto — é o motor mais sensível do projeto)
Cada guardrail hard-stop com 1 caso que deveria ser bloqueado e 1 que deveria passar.

## O que esta fase NÃO inclui
Worker/agentes rodando de verdade (F6) — aqui é só o motor determinístico + guardrails, chamado
manualmente/via serviço, não agendado.

## DoD
```
pnpm --filter core typecheck && pnpm --filter core lint && pnpm --filter core test
```
Verde, com os testes de guardrail citados explicitamente na saída.

## Fluxo obrigatório
1. `implementation_plan.md`/`task.md` — pare para aprovação, incluindo a decisão do kill switch.
2. Branch: `feat/f5-3-motor-decisao`, a partir de `feat/f5-2-governanca`.
3. **Não commite** — DoD verde, me chame para auditar antes do commit/PR.
4. Ambiguidade real de regra de negócio: pare e pergunte.

Ao concluir: núcleo da F5 completo (~68-71% do MVP).
