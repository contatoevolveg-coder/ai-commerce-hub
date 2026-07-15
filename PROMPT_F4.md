# PROMPT F4 — Espinha conectiva + integrações mock-first (ERP-first)

> Cole este prompt inteiro no Antigravity (ou use como plano próprio). Ele assume que
> `ANTIGRAVITY_RULES.md` já foi colado antes (regras de edição segura de arquivo existente).
> Se ainda não colou, cole `ANTIGRAVITY_RULES.md` primeiro — este prompt não repete aquelas regras.

---

## BLOCO 0 — Leitura obrigatória antes de tocar em qualquer arquivo

Leia nesta ordem:
1. `./AGENTS.md` — constituição (stack, 10 regras invioláveis, fluxo obrigatório)
2. `./ANTIGRAVITY_RULES.md` — regras de edição segura (não repita o incidente de sobrescrita)
3. `./ROADMAP.md` seção **F4** (linhas 57–64) — escopo desta fase, já aprovado
4. `./GUARDRAILS.md` — padrões de falha conhecidos
5. `packages/db/src/schema/canal.ts`, `produto.ts`, `pedido.ts` — as tabelas que esta fase conecta
6. `packages/core/pricing/` — motor de margem já pronto, que a camada de serviço vai chamar
7. `apps/web/lib/data/*.ts` — os 6 arquivos que hoje retornam array vazio e serão religados

Se qualquer instrução deste prompt contradisser esses arquivos, ELES vencem. Pare e avise.

---

## Objetivo da fase

Fechar a **espinha conectiva** entre banco (já pronto), motor de preço (já pronto) e as 6 telas
(hoje mostrando vazio). Ao final da F4, o dashboard e as telas devem exibir dados reais vindos
de adapters **mock** determinísticos — não dados fake hardcoded no componente, e sim uma cadeia
real: `Route Handler → serviço → db (Drizzle, com tenant) → resposta tipada`.

Isso NÃO inclui chamar API real de nenhum marketplace/ERP (isso é F8). Mock por design, mas com
o mesmo contrato de interface que o adapter real vai implementar depois — trocar mock↔real deve
ser uma linha de config (`ADAPTER_MODE=mock|real`), nunca um reescreve de chamador.

Peso no roadmap: **+18 pontos** (F4.1 = +8, F4.2 = +10), de 36% para 54%.

---

## Escopo — dividido em 2 entregas (F4.1 e F4.2), cada uma com seu próprio DoD

### F4.1 — Contratos + adapters mock (peso 8)

**Onde:** `packages/integrations/` (hoje só tem `src/index.ts` vazio e `tsconfig.json` — comece
do zero aqui, não há nada para quebrar).

1. `packages/integrations/src/contracts/erp.ts`
   - Interface `ErpAdapter` com os métodos mínimos para o fluxo do PO (ERP é fonte da verdade):
     `listarProdutos(clienteId)`, `obterEstoque(clienteId, produtoIds)`, `listarPedidos(clienteId, desde)`.
   - Tipos de entrada/saída em Zod (`erp.contracts.ts` ou schema colocation) — **regra 2 do
     AGENTS.md**: toda fronteira externa validada com Zod antes de tocar o domínio.
   - Erros do adapter são um union type explícito (`ErpAdapterError`), nunca `throw` genérico.

2. `packages/integrations/src/contracts/marketplace.ts`
   - Interface `MarketplaceAdapter` (Mercado Livre primeiro, deixe Amazon/Shopee como stub do
     mesmo shape, não implemente ainda): `listarAnuncios`, `atualizarPreco`, `atualizarEstoque`.
   - Mesma disciplina Zod + union de erro.

3. `packages/integrations/src/mock/bling.mock.ts`
   - Implementa `ErpAdapter` com dados determinísticos: `SEED=42` (usar um PRNG seedado simples,
     não `Math.random()` cru — precisa ser reproduzível entre rodadas de teste).
   - Simula latência (helper `withLatency(ms)`) e taxa de erro configurável (default 5%,
     `ERROR_RATE` via env) para os outros módulos aprenderem a lidar com falha de rede desde já.
   - **Nunca loga o payload cru** (regra 4 do AGENTS.md) — só metadados (duração, sucesso/erro).

4. `packages/integrations/src/mock/mercadolivre.mock.ts`
   - Mesmo padrão, implementando `MarketplaceAdapter`.

5. `packages/integrations/src/registry.ts`
   - `getErpAdapter(tipo: 'bling')` e `getMarketplaceAdapter(tipo: 'mercadolivre' | ...)`.
   - Lê `ADAPTER_MODE` do env (Zod-validado, ver `packages/core/env` se já existir esse padrão,
     senão crie um schema Zod simples aqui). Se `ADAPTER_MODE=real` e o adapter real não existir
     ainda, lança erro claro de configuração — não caia silenciosamente no mock.

6. `packages/integrations/src/index.ts` — barrel exportando contracts + registry (não os mocks
   diretamente; consumidor não deve importar `*.mock.ts` fora do registry).

7. Testes (Vitest) em `packages/integrations/src/**/*.test.ts`:
   - Mock respeita o contrato (roda o mesmo teste de shape contra qualquer implementação futura).
   - Latência e taxa de erro são observáveis (não precisa ser estatisticamente perfeito, só provar
     que o mecanismo existe e é determinístico com `SEED` fixo).

**DoD de F4.1:** `pnpm --filter integrations typecheck && pnpm --filter integrations lint && pnpm --filter integrations test` verdes. Nenhum outro pacote foi tocado nesta entrega.

---

### F4.2 — Camada de serviço + API BFF + wiring das telas (peso 10)

**Onde:** `packages/core/services/` (novo) + `apps/web/app/api/**/route.ts` (novo) +
`apps/web/lib/data/*.ts` (os 6 arquivos existentes — editar, não recriar).

1. `packages/core/services/produtos.service.ts` (e equivalentes para pedidos, estoque, agentes,
   clientes, kpis do dashboard — um serviço por domínio, espelhando as telas existentes)
   - Padrão fixo: `withTenant(clienteId, db) → query Drizzle filtrada por cliente_id → shape de
     retorno tipado`. Nunca uma query sem filtro de tenant (regra 3 do AGENTS.md) — mesmo com RLS
     como rede de segurança no banco, o filtro explícito na query é obrigatório aqui.
   - Onde envolver preço/margem, chama `packages/core/pricing` — **zero cálculo de dinheiro
     duplicado na camada de serviço** (regra 8 e 9 do AGENTS.md).
   - Zero import de React/Next aqui (regra da estrutura em `AGENTS.md`).

2. `apps/web/app/api/produtos/route.ts` (e demais rotas espelhando os serviços acima)
   - Route Handler fino: valida query params/body com Zod, resolve `clienteId` da sessão (se
     Auth.js ainda não existe nesta fase — F5 — use um `clienteId` de dev vindo de env/header
     documentado como TEMPORÁRIO com comentário `// TODO(F5): trocar por sessão Auth.js`),
     chama o serviço, retorna JSON tipado.
   - Nenhuma lógica de negócio na rota — só orquestração HTTP.

3. Religar os 6 arquivos de `apps/web/lib/data/*.ts`:
   - Trocar o corpo de cada função (hoje `return []` com `// TODO: Supabase`) por um `fetch` para
     a rota correspondente OU chamada direta ao serviço se a função já roda server-side (preferir
     chamada direta ao serviço quando possível — evita round-trip HTTP desnecessário dentro do
     próprio Server Component; use a rota HTTP só onde o client precisa buscar dado via client
     component, ex. filtros interativos).
   - **Não alterar as assinaturas de tipo de retorno** (`Product[]`, `Order[]`, etc.) — as telas já
     consomem esses tipos exatamente como estão em `apps/web/lib/types.ts`. Isso é superset, não
     reescrita (regra 1 do `ANTIGRAVITY_RULES.md`).
   - `getDashboardKpis()` deve parar de retornar KPIs zerados fixos e calcular de verdade a partir
     dos dados mock (contagem de pedidos, soma de receita, etc.) — senão a tela "funciona" mas
     mostra sempre zero, o que não prova nada.

4. Estados de carregamento/erro nas telas que hoje assumem sucesso silencioso — no mínimo o
   `EmptyState` já existente deve aparecer quando o adapter mock retorna vazio, e algum feedback
   visível quando a chamada falha (a taxa de erro de 5% do mock vai acontecer de verdade).

**DoD de F4.2:**
```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
todos verdes, mais: suba `pnpm dev`, navegue pelas 6 telas no browser, confirme que aparecem
dados (não mais vazio-por-padrão) e capture screenshot de cada tela em `walkthrough.md`
(conforme `AGENTS.md` — fluxo obrigatório para UI).

---

## Regras específicas desta fase (além das 10 gerais do AGENTS.md)

- **Nenhuma chamada de rede real.** Todo adapter usado nesta fase é mock. Se você sentir vontade
  de "só testar rápido" contra a API real do Bling ou ML, pare — isso está proibido sem
  autorização explícita (`AGENTS.md` → "Nunca faça sem me perguntar").
- **Zod em toda fronteira.** HTTP (Route Handler) e adapter (contrato) — as duas fronteiras desta
  fase. Nenhum `any`, nenhum cast sem validação.
- **Contrato antes de implementação.** Se ao escrever o mock você perceber que a interface do
  contrato está errada/incompleta, pare e ajuste o contrato primeiro — não implemente workaround
  no mock que o adapter real não conseguiria seguir depois.
- **Dependência nova:** se precisar de biblioteca de PRNG seedado ou similar, proponha e espere
  aprovação antes de `pnpm add` (regra do AGENTS.md — Antigravity não instala sozinho).

---

## Fluxo obrigatório para esta fase

1. Produza `implementation_plan.md` e `task.md` (tarefas de ~1h) e **pare para aprovação antes de
   codar** — mesmo que o escopo já esteja detalhado acima, quebre em passos executáveis.
2. Um branch: `feat/f4-integracoes-mock` (F4.1) — pode desmembrar em `feat/f4-2-api-bff` se preferir
   PR separado para F4.2, mas não obrigatório.
3. Ao final de CADA entrega (F4.1, depois F4.2), rode o DoD completo e cole a saída real.
4. `git status` + `git diff` no final — confirme que o diff contém só o que foi pedido nesta fase.
   Nenhuma mudança em `packages/db/migrations` já aplicada, nenhuma mudança em `.env`/docker.
5. Se encontrar ambiguidade de regra de negócio (ex. o que `atualizarPreco` do ML deveria validar
   antes de aceitar), pare e pergunte — não invente.

---

## Definição de pronto da fase F4 (o que eu vou verificar)

- [ ] `packages/integrations` tem contratos Zod + 2 mocks (Bling ERP, Mercado Livre) + registry
      com `ADAPTER_MODE`, com testes passando.
- [ ] `packages/core/services/` existe com um serviço por domínio, todos filtrando por tenant.
- [ ] Rotas BFF em `apps/web/app/api/**` finas, só orquestração + Zod.
- [ ] As 6 telas mostram dados vindos da cadeia real (não mock hardcoded no componente, não
      array vazio fixo).
- [ ] `getDashboardKpis()` calcula de verdade, não retorna zero fixo.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` verdes, colados na resposta.
- [ ] `walkthrough.md` com screenshot das 6 telas mostrando dado real.
- [ ] Nenhuma chamada de rede real a marketplace/ERP.
- [ ] `git diff` revisado, sem mudança fora do escopo.

Ao concluir, isso fecha F4 (36% → 54% no `ROADMAP.md`) e libera o início de F5 (governança +
segurança + motor de decisão).
