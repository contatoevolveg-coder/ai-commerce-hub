# Implementation Plan — AI Commerce Hub → MVP Funcional

> Baseado no `Promt-Melhoria.pdf` (Prompt de Evolução para MVP Funcional) e ancorado na
> constituição do projeto: `AGENTS.md`, `GUARDRAILS.md` e as skills `design-system`,
> `ai-decisions`, `marketplace-domain`. Onde houver conflito, **AGENTS.md vence**.

Status: **aguardando aprovação** (conforme regra 55 do AGENTS.md: plano antes de codar).

---

## 1. Checagem de contradições (exigida pelo BLOCO 0)

Nenhuma contradição **dura** entre o prompt e o `AGENTS.md`. O prompt foi escrito para se
alinhar (removeu `organization_id` justamente para não colidir com `cliente_id`). Tensões
menores, todas resolvidas a favor do AGENTS.md:

| Tema | Prompt | AGENTS.md / skill | Resolução |
|---|---|---|---|
| Workers/filas | "removidos da F0, voltam na F6" | stack lista BullMQ + `apps/worker` | Adiado para F6. Sem conflito (é fasing). |
| Estrutura de integrations | `contracts/ mock/ real/` | "adapter por canal em `integrations/<canal>`" | Uso `contracts/` + `mock/` + `real/` (contract-first, mais explícito). Os mocks por canal (`MockMercadoLivreAdapter` etc.) ficam sob `mock/`. Compatível. |
| 4º estado das telas | "default, loading, vazio, erro" | skill: "loading, vazio, erro, degradado" | Sigo a skill: loading, vazio, erro, **degradado** (tarja âmbar em conector offline). |
| Auth | "Supabase Auth já oferece" | "Auth.js + RBAC" | Auth.js como camada (regra do AGENTS), podendo usar Supabase como provider. |

Conclusão: **posso prosseguir** sem parar por contradição.

---

## 2. Decisões de arquitetura (fixas neste plano)

- **Mock-first com contrato único** (BLOCO 1). `packages/integrations/contracts/MarketplaceAdapter.ts`
  é a fonte da verdade. `ADAPTER_MODE=mock|real` no `.env` decide o registry — **um** ponto de
  escolha, zero `if (mock)` no código de negócio.
- **Mock realista**: latência 150–800ms, taxa de erro 5% (timeout/429/500), rate-limit simulado,
  dados relacionais coerentes, **determinístico com SEED=42** (LCG próprio, sem lib externa).
- **Dinheiro** = `bigint` centavos. **Percentual** = basis points. Divisão sempre por último.
- **Tenant** = `cliente_id` NOT NULL em toda tabela de negócio + RLS no Postgres.
- **IA** = entidade `Decisao` na máquina de estados da skill `ai-decisions`. Agentes **propõem**,
  nunca escrevem no banco de negócio.
- **Motor financeiro** = `packages/core/pricing`, função pura, expõe a decomposição inteira
  (`ResultadoMargem`), não só o total. Comissão via **Strategy Pattern** + `canal_tarifa` versionada.

---

## 3. Mapa de fases (do prompt, ancorado nas fases do projeto)

| Fase | Entrega | Critério de aceite verificável |
|---|---|---|
| **F3** | M1 (schema Drizzle + RLS) + M2 (motor financeiro) | `pnpm test -- tenant-isolation`, `audit-append-only`; cobertura pricing ≥ 90%; teste de regressão histórica de tarifa; ESLint barra `float` em dinheiro |
| **F4** | Mock adapters + telas de leitura (Mission Control, Catalog) | 4 estados por tela; Playwright de navegação; números batem entre telas |
| **F5** | M3 (motor de decisão) + Governance Center + Audit | guardrail acima da autonomia nível 5; transição inválida lança erro; kill switch; `estado_anterior_json` |
| **F6** | Agentes rodando sobre o motor (apps/worker volta aqui) | agente não escreve em `produto`/`produto_espelho` (grep = 0) |
| **F7** | Smart Pricing, Inventory, Market Intelligence | waterfall usa `ResultadoMargem`; slider recalcula pelo core |
| **F8** | Troca `mock`→`real` (Bling v3). **Uma linha de config.** | adapter real implementa o mesmo contrato; troca sem reescrita |
| **F9** | Hardening | DoD completo do BLOCO 4 |

---

## 4. Dependências novas necessárias (regra 68 — proponho e justifico)

Nada é instalado sem sua aprovação. Proposta:

**Núcleo (F3–F5) — baixo risco, essenciais para os critérios de aceite:**
- `fast-check` (dev) — testes de propriedade do motor financeiro (exigido pelo M2).
- `@paralleldrive/cuid2` **ou** usar `crypto.randomUUID` nativo — IDs. *Prefiro nativo, zero dep.*
- Crypto AES-256-GCM → **`node:crypto` nativo**, zero dep.
- Seed determinístico → **LCG próprio**, zero dep.

**Integração/testes (F4):**
- `msw` (dev) — intercepta HTTP nos testes de integração (exigido pelo BLOCO 1).

**UI (F4/F7) — exigidas pelo AGENTS.md, ainda não instaladas:**
- `@tanstack/react-table`, `@tanstack/react-query`, `recharts`, primitivos `shadcn/ui`
  (via `@radix-ui/*`). São stack oficial do AGENTS.md. Alto impacto no bundle e no padrão de código.

**Auth (F5):**
- `next-auth` (Auth.js) + adapter Supabase.

> **Recomendação:** aprovar o **núcleo (fast-check)** agora para destravar F3, e decidir as
> dependências de UI/Auth quando chegarmos em F4/F5 (evita instalar o que ainda não vamos usar).

---

## 5. Banco de dados para os testes de RLS (M1)

Os critérios `tenant-isolation` e `audit-append-only` precisam de um Postgres real com RLS.
Opções:
- **(A) Postgres local via `docker-compose.yml`** (já existe no repo) — isolado, seguro, ideal para CI. Requer Docker rodando na sua máquina.
- **(B) Supabase cloud do `.env`** — funciona, mas escreve na nuvem de produção/staging. Não recomendo para testes destrutivos.
- **(C) Adiar execução** — escrevo schema + RLS + os testes, mas eles rodam quando o DB estiver disponível.

> **Recomendação: (A)**. Se o Docker não estiver disponível agora, sigo com (C) e deixo tudo pronto.

---

## 6. O que construo primeiro (F3) — assim que aprovado

Ordem, cada item verificado antes do próximo:

1. **`packages/core/pricing`** — `calcularMargem` puro, `ResultadoMargem` completo, fórmulas em
   bigint, Strategy Pattern de comissão + `canal_tarifa` versionada. Testes Vitest + (fast-check
   se aprovado). Regra ESLint `no-restricted-syntax` barrando `Number()/parseFloat/.toFixed()` em dinheiro.
2. **`packages/db`** — schema Drizzle com as ~20 entidades do M1, `cliente_id` NOT NULL, RLS,
   trigger append-only no `audit_log`, migration. Testes `tenant-isolation` e `audit-append-only`.
3. **`packages/integrations`** — `contracts/MarketplaceAdapter.ts` + mocks (ML, Amazon, Shopee)
   com latência/erro/seed + registry por `ADAPTER_MODE`.

Cada um fecha com `pnpm typecheck && pnpm lint && pnpm test && pnpm build` verde (DoD do BLOCO 4).

---

## 7. Controle de versão

- Um branch por fase (`feat/f3-schema-pricing`), Conventional Commits em inglês no título,
  corpo em PT-BR. Push para o GitHub a cada fase concluída e verificada.
- `implementation_plan.md` (este arquivo) e `task.md` versionados.

---

## 8. Fora de escopo nesta rodada (explícito, conforme DoD)

- Canais além de ML/Amazon/Shopee (Magalu, TikTok, Shein) — contrato já suporta, adiciona quando houver cliente.
- Integração real com Bling (F8) — só o contrato agora.
- Workers/filas reais (F6).
- Migração para Next.js 15 (rastreada à parte).
