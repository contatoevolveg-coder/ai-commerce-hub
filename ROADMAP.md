# ROADMAP — AI Commerce Hub / Infinoos Commerce

Roadmap unificado: funde os objetivos do PO (apresentação Infinoos Commerce) dentro das
fases técnicas F3–F9 já em execução. Ancorado na constituição (`AGENTS.md`, `GUARDRAILS.md`,
skills) e no `implementation_plan.md`. Segurança é fio condutor, não uma fase no fim.

Princípio do PO que guia tudo: **o ERP do cliente é a fonte da verdade; a Infinoos é a camada
inteligente que lê, diagnostica, recomenda e executa sob aprovação humana.** O norte é fechar
UM fluxo vertical completo e confiável antes de multiplicar agentes:

```
ERP (Bling) → Agente ERP → Camada Inteligente → Agente Marketplace → Tarefa/Aprovação → Execução/Log → Relatório
```

---

## Onde estamos hoje (~36% de um MVP demonstrável)

Medido por peso de esforço sobre o escopo do MVP unificado. Percentuais são estimativa honesta,
não otimista.

| Bloco | Peso | Estado | Pontos |
|---|---|---|---|
| Fundação monorepo + tooling + CI + tokens | 5 | ✅ | 5 |
| Design system (componentes base) | 5 | ✅ | 5 |
| UI shell + 6 telas (em dados mock vazios) | 8 | ✅ | 8 |
| Schema multi-tenant + RLS + audit (M1) | 10 | ✅ validado ao vivo | 10 |
| Motor de preço/margem (M2) | 8 | ✅ 93% cobertura | 8 |
| Integrações mock-first (contratos + adapters) | 8 | ❌ | 0 |
| Camada de serviço + API BFF + wiring telas↔dados | 10 | ❌ | 0 |
| Motor de decisão IA / orquestrador (M3) | 8 | ❌ (só schema) | 0 |
| Fila de Tarefas/Aprovações (Governance) | 6 | ❌ | 0 |
| Auth.js + RBAC (M5) | 6 | ❌ | 0 |
| Cripto de credenciais AES-256-GCM | 3 | ❌ (colunas prontas) | 0 |
| Diagnóstico de cadastro + RegraPreco por cliente | 5 | ❌ | 0 |
| Conector Bling ERP real | 6 | ❌ | 0 |
| Worker (agentes/jobs) | 4 | ❌ | 0 |
| Motores estoque/concorrência/relatórios | 5 | ❌ | 0 |
| Seed + hardening + docs LGPD | 3 | ❌ | 0 |
| **TOTAL** | **100** | | **36** |

O que está pronto é a parte mais difícil e mais "ancorante" (dados isolados por tenant provados,
motor financeiro determinístico). Falta a **espinha conectiva** e a **camada de operação assistida**.

---

## Mapa unificado — objetivos do PO fundidos nas fases

Cada fase marca: 🔒 = entrega de segurança/ancoragem · 📋 = módulo do PO absorvido.

### F3 — Fundação de dados e cálculo ✅ CONCLUÍDA
- ✅ M1: schema 21 entidades, `cliente_id` + RLS `FORCE` + `app_role`, trigger append-only. Validado no Supabase real.
- ✅ M2: motor de preço/margem puro (bigint, decomposição completa, preço-piso).
- 📋 PO absorvido: "Motor de preço e margem", "Log e auditoria", base do "Catálogo espelho" (schema), "Cliente/ProdutoEspelho/Recomendacao(=decisao)/LogAcao".
- 🔒 Isolamento multi-tenant provado por teste contra banco real.

### F4 — Espinha conectiva + integrações mock-first (ERP-first)
- Contrato único `packages/integrations/contracts/` + `mock/` (latência, erro 5%, SEED=42, `ADAPTER_MODE`).
- **Adapter ERP mock (Bling) primeiro** — alinha com a Fase 1 do PO (ERP é fonte da verdade).
- Camada de serviço (`withTenant` → query `db` → `pricing`) + Route Handlers (BFF).
- Ligar as 6 telas a dados reais (mock) via API.
- 📋 PO absorvido: "Agentes ERP/Conectores" (contrato), "Catálogo espelho" (import), "EstoqueSnapshot", "ConexaoERP/ConexaoMarketplace/AnuncioCanal".
- 🔒 Zod em toda fronteira (HTTP + adapter); nenhuma credencial em log.

### F5 — Camada inteligente + Governança + Segurança
- M3: motor de decisão (máquina de estados da skill ai-decisions) + guardrails (margem mínima acima da autonomia) + kill switch.
- **Entidade `tarefa` + Governance Center** (fila humana com responsável/prazo/aprovador) — coração da "operação assistida".
- **`regra_preco`/estratégia por cliente** (margem mínima, desconto máx) — tabela nova exigida pelo PO.
- "Diagnóstico de cadastro" (campos faltando → gera Tarefa).
- M5: Auth.js + RBAC (admin/pricing/atendimento/auditor) + **cripto AES-256-GCM** das credenciais.
- 📋 PO absorvido: "Tarefas e aprovações", "Estratégia por cliente", "Diagnóstico de cadastro", "Orquestrador (base)".
- 🔒 auditor recebe 403 em aprovar; credencial cifrada; sem PII em log; nota de retenção LGPD.

### F6 — Agentes rodando (worker)
- `apps/worker` (BullMQ/Redis) + orquestrador + agente Bling (diagnóstico) + agente Mercado Livre.
- SLA de sync 15–30 min (proposta do PO); idempotência por SHA-256.
- 📋 PO absorvido: "Orquestrador de agentes", Fase 1/3 do backlog do PO, "SLA de sincronização".
- 🔒 nenhum agente escreve em produto/espelho fora do motor; kill switch global.

### F7 — Motores de valor + telas operacionais
- Motor de estoque (ruptura/giro/cobertura), Análise de concorrência, Smart Pricing, Product 360°.
- **Modo sandbox/dry-run** (proposta do PO) para toda ação sensível.
- 📋 PO absorvido: "Motor de estoque", "Análise de concorrência", "Canal ideal", "Priorização".

### F8 — Bling real (troca mock→real, 1 linha de config)
- 📋 PO absorvido: Fase 1 real, "Envio controlado" com log antes/depois.
- 🔒 OAuth2 refresh, credencial só cifrada, sandbox em dev.

### F9 — Relatórios automáticos + Hardening + LGPD
- 📋 PO absorvido: "Relatórios automáticos", "Monitoramento/saúde dos conectores".
- 🔒 revisão de RLS, rotação de chave, retenção/exclusão LGPD, headers de segurança.

---

## Caminho até sexta — meta ~70%

Chegar a 70% = **fechar a F4 inteira + o núcleo de segurança/governança da F5**. É agressivo para
2 dias, mas é o caminho de maior valor: constrói exatamente a espinha que hoje falta.

Ordem sugerida (cada item fecha com typecheck+lint+test verdes, conforme DoD):

1. **F4.1** Contratos + mock adapters (ERP Bling + ML/Amazon/Shopee) — +8
2. **F4.2** Camada de serviço + API BFF + wiring das telas a dados reais — +10
3. **F5.1** Cripto AES-256-GCM das credenciais (rápido, alto valor de segurança) — +3
4. **F5.2** `regra_preco` + `tarefa` + Governance Center (fila de aprovação) — +6
5. **F5.3** Motor de decisão M3 (máquina de estados + guardrail de margem) — +8

Baseline 36 + (8+10+3+6+8) = **71%**. Auth/RBAC completo (F5 M5) e o worker (F6) ficam como o
próximo bloco pós-sexta.

> Nota honesta: 70% do MVP unificado em 2 dias depende de manter o escopo nesses 5 itens e não
> abrir frentes novas. Auth completo, Bling real e relatórios NÃO entram nessa meta — e tudo
> bem, porque a espinha + governança + segurança de credencial são o que torna o projeto
> "demonstrável e confiável" para um piloto, que é o objetivo do PO.

---

## Segurança — o que já ancora e o que falta

| Item | Estado |
|---|---|
| Isolamento multi-tenant (RLS + FORCE + app_role) | ✅ validado ao vivo |
| audit_log append-only (trigger no banco) | ✅ validado |
| Segredos fora do repo (.env gitignored) | ✅ |
| Cripto AES-256-GCM das credenciais | ❌ F5 (colunas prontas) |
| Auth.js + RBAC | ❌ F5 |
| Zod em toda fronteira | 🟡 parcial (env sim; HTTP/adapter na F4) |
| Retenção/exclusão LGPD | ❌ F9 |
| Sem PII/token em log | 🟡 regra existe, falta enforcement automatizado |
