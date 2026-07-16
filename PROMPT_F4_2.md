# PROMPT F4.2 — Camada de serviço + API BFF + wiring das 6 telas

> Cole este prompt no Antigravity. Pré-requisito: F4.1 já está mergeado/aprovado (PR #1:
> contratos + mocks em `packages/integrations`). Este prompt cobre só o F4.2, conforme
> `ROADMAP.md` e a seção "F4.2" de `PROMPT_F4.md` — com 2 ajustes obrigatórios encontrados ao
> conferir o estado real do repo antes de começar (mesmo padrão do F4.1: aprovação condicional).

---

## BLOCO 0 — Leitura obrigatória antes de tocar em qualquer arquivo

1. `./AGENTS.md`, `./ANTIGRAVITY_RULES.md`, `./ROADMAP.md` (seção F4.2)
2. `packages/db/src/tenant-context.ts` — `withTenant(clienteId, callback)` **já existe e pronto**,
   é a função exata que a camada de serviço deve usar. Não reimplemente.
3. `packages/db/src/index.ts` — instância `db` (Drizzle) já configurada com `app_role`.
4. `packages/db/src/schema/*.ts` — `produto`, `pedido`, `itemPedido`, `comprador`, `estoque`,
   `canal`, `cliente` — os campos exatos que os serviços vão consultar/inserir.
5. `packages/integrations/src/registry.ts` e `contracts/*.ts` (F4.1, já pronto) — `getErpAdapter`,
   `getMarketplaceAdapter`.
6. `apps/web/lib/types.ts` e `apps/web/lib/data/*.ts` — os 6 arquivos e os tipos que as telas
   já consomem. **Não alterar assinatura de tipo de retorno.**

---

## Ajuste obrigatório 1 — o banco está vazio; precisa de seed determinístico ANTES do wiring

`packages/db/src/seed.ts` hoje é um stub (`console.log('Seed: Start')`, nada insere). Se você
religar as telas direto no banco sem popular nada primeiro, o resultado visual é **idêntico ao
bug atual** (telas vazias) — só que a causa muda de "sem wiring" para "banco sem dado", o que
não resolve o problema visível para o usuário nem prova que a cadeia funciona.

**Isto é trabalho novo, faça como Passo 0 do F4.2, antes de escrever qualquer serviço:**

1. Defina uma constante `DEV_CLIENTE_ID` fixa (UUID literal, ex.
   `'00000000-0000-0000-0000-000000000001'`) em `packages/db/src/seed.ts` — não gere um UUID
   aleatório a cada execução. O motivo é o mesmo do `SEED=42` nos mocks do F4.1: precisa ser
   reproduzível e referenciável de fora (a API BFF vai usar esse mesmo valor).
2. `seed.ts` deve ser **idempotente** (upsert / `ON CONFLICT DO NOTHING` ou delete-then-insert
   por `cliente_id` fixo) — rodar `pnpm db:seed` duas vezes não pode duplicar linhas nem quebrar.
3. Insira, usando a conexão **privilegiada** (`DATABASE_URL`, o mesmo padrão já usado em
   `packages/db/src/__tests__/tenant-isolation.test.ts` para arranjar fixtures — RLS protege
   query de negócio, não script administrativo de setup):
   - 1 `cliente` (`id = DEV_CLIENTE_ID`, nome "Loja Demo")
   - 1 `canal` do tipo mercado_livre vinculado a esse cliente
   - 4–6 `produto` com `sku`/`nome`/`cmvCentavos`/`categoria` variados (dados estáticos
     representativos, não precisa vir do mock adapter — isso é fixture de banco, não simulação
     de rede; a simulação de rede já existe nos mocks do F4.1 e serve para outro propósito:
     testar a resiliência da camada de integração, não para popular o catálogo)
   - `estoque` correspondente a cada produto
   - 3–5 `pedido` (`comprador` + `itemPedido`) com datas/status variados nos últimos 30 dias,
     para o dashboard e os gráficos terem o que somar
4. Documente `DEV_CLIENTE_ID` em `.env.example` como comentário (não como variável de conexão —
   é um dado de aplicação, não credencial) e exporte a constante de algum lugar importável
   (ex. `packages/db/src/dev-tenant.ts`) para a API BFF reusar o mesmo valor em vez de duplicar
   o literal.

DoD deste passo: `pnpm db:seed` roda contra o Supabase configurado em `.env`, sem erro, e uma
query manual (`select count(*) from produto`) confirma linhas inseridas.

---

## Ajuste obrigatório 2 — `packages/core` precisa de 2 dependências novas de workspace

Hoje `packages/core/package.json` só depende de `zod`. Os serviços que você vai criar em
`packages/core/src/services/` (path confirmado — é `src/services`, não `services/` direto, siga
o mesmo padrão de `packages/core/src/pricing`) precisam de `db` (para `withTenant`/schema) e de
`integrations` (para o registry de adapters). Adicione a `packages/core/package.json`:

```json
"dependencies": {
  "zod": "3.23.8",
  "@ai-commerce/db": "workspace:*",
  "@ai-commerce/integrations": "workspace:*"
}
```

Isso não é dependência externa nova (são pacotes internos do próprio monorepo), mas é uma
mudança real na direção de dependências do projeto — registre isso claramente no `git diff` e no
`implementation_plan.md`, não silenciosamente.

---

## Escopo (retomando o que já estava definido em `PROMPT_F4.md` → seção F4.2)

1. **`packages/core/src/services/`** — um serviço por domínio (`produtos.service.ts`,
   `pedidos.service.ts`, `dashboard.service.ts`, `agentes.service.ts`, `clientes.service.ts`):
   - Padrão fixo: `withTenant(clienteId, async (tx) => { ... })` → query Drizzle em `tx` filtrada
     implicitamente pela RLS (a policy já filtra por `cliente_id` da sessão — mas mantenha
     `where eq(produto.clienteId, clienteId)` explícito mesmo assim, é defesa em profundidade,
     não redundância inútil).
   - Onde envolver preço/margem, chama `packages/core/src/pricing` — zero cálculo de dinheiro
     duplicado (regra 8/9 do AGENTS.md).
   - `agentes.service.ts` pode usar `getErpAdapter`/`getMarketplaceAdapter` do F4.1 diretamente
     (ex. para expor status de conexão mock na tela de Agentes) — esse é o caso legítimo de uso
     direto do adapter fora do fluxo de seed.

2. **`apps/web/app/api/**/route.ts`** — Route Handlers finos: Zod no input, resolve
   `clienteId` via `process.env.DEV_CLIENTE_ID` (server-only, nunca `NEXT_PUBLIC_*`) com
   `// TODO(F5): trocar por sessão Auth.js`, chama o serviço, retorna JSON.

3. **Religar os 6 arquivos de `apps/web/lib/data/*.ts`** — mesma regra de antes: aditivo, tipos
   de retorno inalterados, preferir chamar o serviço direto em Server Component (evita round-trip
   HTTP) e só usar a rota BFF onde um Client Component precisa buscar via fetch.
   `getDashboardKpis()` deixa de retornar zero fixo — soma de verdade a partir do seed.

4. Estados de loading/erro visíveis nas telas (`EmptyState` quando vazio de verdade — ex. tela de
   Clientes pode legitimamente estar vazia se não houver `comprador` sem pedido —, feedback de
   erro quando a chamada falha).

---

## DoD do F4.2

```
pnpm db:seed
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Todos verdes, mais: suba `pnpm dev`, navegue pelas 6 telas, confirme dado real do seed aparecendo
(não zero, não vazio-por-padrão), capture screenshot de cada tela em `walkthrough.md`.

---

## Fluxo obrigatório

1. `implementation_plan.md` + `task.md` atualizados para o F4.2, com os 2 ajustes acima já
   incorporados — pare para aprovação antes de codar.
2. Branch: `feat/f4-2-servicos-bff` (branch novo, não emenda no `feat/f4-integracoes-mock` já
   mergeado).
3. DoD completo colado ao final, `git diff` revisado.
4. Ambiguidade de regra de negócio (ex. o que conta como "pedido recente" no KPI de conversão):
   pare e pergunte, não invente.

Ao concluir: F4 completa (36% → 54% no `ROADMAP.md`), libera F5.
