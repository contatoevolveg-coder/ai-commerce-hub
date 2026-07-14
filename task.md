# task.md — F3: Dados/RLS + Motor Financeiro

Quebra em tarefas de ~1h, conforme fluxo obrigatório do AGENTS.md. Branch: `feat/f3-schema-pricing`.

## Decisão de design (antes de codar)

`packages/core/pricing` deve ser zero I/O, mas `calcularMargem` recebe `data: Date` para
resolver a tarifa vigente. Resolução: a função recebe as **tarifas candidatas já buscadas**
(array simples) e escolhe a vigente internamente por filtro de data — isso é puro (sem fetch).
Quem busca no banco (`packages/db` ou uma camada de repositório) fica fora do pricing.

## Dependências novas (aprovadas ou propostas dentro do escopo já aprovado)

- `fast-check` (dev, `packages/core`) — aprovada pelo usuário para testes de propriedade do M2.
- `@vitest/coverage-v8` (dev, `packages/core`) — necessária para medir o critério de aceite
  "cobertura ≥ 90%"; mesma categoria de tooling de teste do fast-check, sem footprint de runtime.
- `vitest` (dev, `packages/core` e `packages/db`) — já era dependência raiz; adicionada
  explicitamente por pacote (padrão pnpm workspace estrito, evita depender de hoisting).

## Tarefas

1. [x] `packages/core/pricing/types.ts` — tipos: `CanalTarifaRow`, `ResultadoMargem`,
   `CalcularMargemInput`, `RegimeTributario`, mais `FaixaFrete`/`FaixaTaxaFixa` (não previstos
   no prompt original, necessários porque taxa_fixa/frete são conceitos distintos de comissão).
2. [x] `packages/core/pricing/tarifa.ts` — `resolverTarifaVigente`, `resolverFaixaFrete`,
   `resolverTaxaFixa`, todos puros.
3. [x] `packages/core/pricing/comissao/ComissaoStrategy.ts` + registry por `canalId`.
4. [x] `packages/core/pricing/comissao/strategies/` — MercadoLivreStrategy, AmazonStrategy,
   ShopeeStrategy. Nenhum número de comissão hardcoded no código-fonte (só em fixtures de
   teste, claramente marcadas como fictícias, per GUARDRAILS.md).
5. [x] `packages/core/pricing/calcularMargem.ts` — função pura principal. `precoPisoCentavos`
   resolvido por busca binária (não fórmula fechada), pois comissão pode ser não-linear
   (tipo matriz) — fórmula fechada só funcionaria no caso percentual simples.
6. [x] `packages/core/pricing/formulas.ts` — markupBps, breakEvenUn (arredonda pra cima), roiBps.
7. [x] `packages/core/pricing/index.ts` + `packages/core/src/index.ts` — barrel exports.
8. [x] Testes Vitest: 30 testes (fórmulas, Strategy, resolução de tarifa/frete/taxaFixa,
   consistência do precoPiso).
9. [x] Teste de propriedade (fast-check, 1000 execuções): para qualquer preço > precoPiso,
   margemLiquida > 0; e para qualquer preço <= precoPiso, margemLiquida <= 0.
10. [x] Teste de regressão: INF-3390 no ML em 2026-02-01 (comissão 12%) vs 2026-04-01
    (comissão 15%) → comissão e margem diferentes, prova que o versionamento funciona.
11. [x] Regra ESLint: `.toFixed()` banido em todo o repo; `Number()`/`parseFloat()` banidos em
    `packages/core/pricing/**` e `packages/db/src/schema.ts`. Verificado que a regra realmente
    pega violação (teste manual com snippet descartável). Corrigido 1 violação pré-existente
    (`SalesChart.tsx` usava `.toFixed()` sobre soma de vendas).
12. [x] `packages/core` e `packages/db` ganharam script `lint` (antes só `apps/web` rodava
    ESLint via `pnpm lint`/turbo — a regra existia mas nunca era checada nesses pacotes).
13. [x] `packages/db/src/schema/` — 21 entidades do M1 (era `schema.ts` único, virou pasta por
    domínio: cliente, canal, produto, pedido, ia, sistema — mais fácil de outros devs navegarem).
    `cliente_id` NOT NULL em toda tabela de negócio + RLS via `pgPolicy`/`.enableRLS()` nativo
    do Drizzle 0.45. `papel` é a única tabela sem `cliente_id`/RLS (referência global fixa,
    não é dado de negócio por tenant).
14. [x] **Descoberta crítica não prevista no prompt original**: superusuário/dono da tabela
    SEMPRE ignora RLS no Postgres, mesmo com `FORCE ROW LEVEL SECURITY`. Como a conexão local
    (`postgres/postgres` do docker-compose) é superusuário, testar RLS por ela daria falso
    positivo. Criada `drizzle/0002_app_role_bootstrap.sql` com role `app_role` não-superusuário,
    e `APP_DATABASE_URL` separada de `DATABASE_URL` (privilegiada, só migrations). Documentado
    em `.env.example`; `.env` real NÃO foi tocado (regra do AGENTS.md).
15. [x] Trigger append-only em `audit_log` — `drizzle/0001_force_rls_and_audit_append_only.sql`
    (FORCE RLS nas 20 tabelas de negócio + trigger que bloqueia UPDATE/DELETE).
16. [x] `pnpm db:generate` roda sem DB ativo, gerou a migration inicial (21 tabelas, 20 policies).
    Rodado uma segunda vez: "No schema changes, nothing to migrate" — schema e snapshot em sincronia.
17. [x] Testes `tenant-isolation` (5 casos, incluindo INSERT com WITH CHECK) e
    `audit-append-only` (2 casos) — escritos, tipados, lintados. Pulam com aviso claro quando
    `APP_DATABASE_URL` não está configurada (não derrubam a suíte).
18. [ ] **NÃO VERIFICADO AO VIVO**: não há Docker nem Postgres nativo disponível neste ambiente
    de execução. O SQL foi revisado manualmente linha a linha (policies, FORCE RLS, trigger,
    grants) e a lógica está correta pelo meu conhecimento de semântica do Postgres, mas isso
    não substitui rodar de verdade. **Ação necessária do usuário**: `docker compose up -d`,
    depois `cd packages/db && pnpm db:push`, configurar `APP_DATABASE_URL` no `.env` real
    (valor sugerido em `.env.example`), depois `pnpm test` — os 7 testes devem passar de verde.
19. [ ] Teste `tenant-isolation` **via rota HTTP** — marcado `test.todo()`. Não existe nenhuma
    Route Handler ainda (isso é F4). Sinalizado explicitamente, não omitido silenciosamente.
20. [x] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — todos verdes (saída no
    resumo da conversa). `pnpm test` = 30 passed, 6 skipped (RLS, sem DB), 1 todo (rota HTTP).

## Nota sobre dados de tarifa reais

GUARDRAILS.md: "se faltar uma taxa real, PARE e pergunte. Não invente comissão." As
percentagens de comissão do ML/Amazon/Shopee usadas em testes são **fixtures fictícias**,
não valores reais de produção — a F3 entrega o mecanismo (schema + engine), não os dados
reais de tarifa. Seed com tarifas reais fica para quando você fornecer os valores.
