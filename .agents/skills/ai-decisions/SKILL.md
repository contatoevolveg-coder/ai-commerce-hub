---
name: ai-decisions
description: Use ao implementar qualquer agente de IA, execuÃ§Ã£o de agente, fila de
aprovaÃ§Ã£o, autonomia, governanÃ§a, quarentena ou audit log.
---

# Motor de DecisÃ£o de IA

## MÃ¡quina de estados (Ãºnica forma de a IA agir no sistema)
proposed â†’ (auto_approved | pending_review) â†’ approved â†’ executing â†’ executed
                                            â†˜ rejected        â†˜ failed â†’ (retry | dead_letter)

Toda transiÃ§Ã£o grava em `audit_log` (append-only) com ator, timestamp, payload e motivo.

## NÃ­veis de autonomia (por agente, 1â€“5)
1 â†’ Apenas sugere, nÃ£o executa
2 â†’ Executa aÃ§Ã£o reversÃ­vel com impacto atÃ© R$ 100
3 â†’ Executa com impacto atÃ© R$ 500
4 â†’ Executa com impacto atÃ© R$ 2.000
5 â†’ AutÃ´nomo total dentro dos limites da regra do agente

Acima do limite de impacto â†’ estado `pending_review` (quarentena no Governance Center).
O limite Ã© calculado sobre o **impacto financeiro estimado**, nÃ£o sobre % de variaÃ§Ã£o.

## Campos obrigatÃ³rios em toda `Decisao`
- agente_id
- versao_do_prompt
- modelo (ex: claude-sonnet-4-6)
- input_hash (SHA-256 do input canÃ´nico)
- proposta (JSON com o que serÃ¡ feito)
- raciocinio (texto em linguagem natural, 1â€“3 frases)
- impacto_estimado_centavos (bigint, pode ser negativo = perda)
- confianca (0â€“100)
- tokens_in, tokens_out
- custo_centavos
- estado (enum da mÃ¡quina de estados)
- ator_aprovador (null se autÃ´nomo)

## Guardrails hard stop (a IA nunca ultrapassa, nem no nÃ­vel 5)
- PreÃ§o nunca abaixo do preÃ§o-piso (margem 0% apÃ³s comissÃ£o + taxa fixa + frete + imposto + CMV).
- PreÃ§o atacado nunca acima de 97% do preÃ§o varejo.
- VariaÃ§Ã£o de preÃ§o > 15% em 24h para o mesmo SKU â†’ obrigatoriamente pending_review.
- Kill switch global: flag `ai_execution_enabled` desliga toda execuÃ§Ã£o autÃ´noma em 1 clique.
- Toda execuÃ§Ã£o guarda estado anterior para rollback com 1 clique.

## Custo e limites
- Todo call de LLM registra tokens e custo, agregados por agente/mÃ³dulo/mÃªs.
- Ao atingir 80% do limite mensal do cliente â†’ alerta.
- Ao atingir 100% â†’ agentes caem para nÃ­vel 1 (apenas sugerem).

## Rollback
Toda Decisao executada pode ser revertida:
1. O estado anterior Ã© armazenado em `decisao.estado_anterior_json`
2. Rollback grava nova Decisao do tipo "rollback" referenciando a original
3. Ambas ficam visÃ­veis no Audit Log
