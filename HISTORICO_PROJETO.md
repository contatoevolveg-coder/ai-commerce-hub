# HISTÓRICO_PROJETO.md — Estado real do projeto, fase a fase

> **Leitura obrigatória antes de qualquer fase nova**, junto com `AGENTS.md`,
> `ANTIGRAVITY_RULES.md`, `GUARDRAILS.md` e `ROADMAP.md` (ver BLOCO 0 do
> `ANTIGRAVITY_RULES.md`). Este arquivo existe porque um agente já reimplementou
> uma fase inteira do zero por não saber o que já tinha sido feito e validado —
> ver "Incidente 2" no `GUARDRAILS.md`. Este documento é **atualizado a cada fase
> concluída e mergeada** — se você está lendo isto e uma fase abaixo não bate com
> o que existe no repositório agora, PARE e avise: o documento está desatualizado
> e precisa ser corrigido antes de você continuar.

---

## Estado agora (referência rápida)

- **Commit atual em `main`:** `5475a6e` — "docs: incidente 2 + modelo de colaboração"
- **Produção ao vivo:** https://ai-commerce-hub-web.vercel.app — pública, sem login, dados reais
- **Progresso do MVP:** ~54% (ver tabela em `ROADMAP.md`) — F3 e F4 completas
- **Próxima fase:** F5.1 (cripto de credenciais)
- **Banco:** Supabase (`ai-commerce-hub`, projeto `hxczjohoojfqwnanzvef`, região `sa-east-1`),
  produção conectada via **Transaction Pooler** (porta 6543, IPv4) — não pela conexão direta
  (IPv6, incompatível com a Vercel)

---

## F3 — Fundação de dados e cálculo ✅ (concluída antes deste histórico começar)

- Schema Drizzle com 21 entidades em `packages/db/src/schema/` (arquivos: `enums.ts`,
  `cliente.ts`, `canal.ts`, `produto.ts`, `pedido.ts`, `ia.ts`, `sistema.ts`), todas
  multi-tenant (`cliente_id` + RLS `FORCE ROW LEVEL SECURITY` + policy via
  `tenantIsolationPolicy()` em `packages/db/src/schema/rls.ts`).
- Isolamento de tenant **validado contra banco real** (`packages/db/src/__tests__/tenant-isolation.test.ts`).
- Motor de preço/margem em `packages/core/src/pricing/` — puro, bigint, 93%+ cobertura,
  Strategy Pattern de comissão por canal (`ComissaoStrategyRegistry`), preço-piso via busca
  binária (`calcularMargem.ts` → `encontrarPrecoPiso`).
- Bug de RLS achado e corrigido em produção: `current_setting(x, true)` retorna string vazia
  (não NULL) em conexão de pool reciclada — corrigido com `nullif(..., '')::uuid` em
  `packages/db/src/schema/rls.ts`.

## F4.1 — Contratos + adapters mock ✅ (PR #1, mergeado)

- `packages/integrations/src/contracts/erp.ts` e `marketplace.ts`: interfaces `ErpAdapter` e
  `MarketplaceAdapter`, validação Zod em toda fronteira.
- `packages/integrations/src/mock/bling.mock.ts` e `mercadolivre.mock.ts`: mocks determinísticos
  (seed fixo), latência simulada, taxa de erro configurável.
- `packages/integrations/src/registry.ts`: resolve mock vs real via `ADAPTER_MODE`
  (env próprio em `packages/integrations/src/env.ts` — schema Zod local, **não** estende
  `packages/core/src/env.ts`, para não criar dependência de `core` sobre `integrations`).
- Nenhuma chamada de rede real a marketplace/ERP.

## F4.2 — Camada de serviço + BFF + telas ligadas a dados reais ✅ (PR #2, mergeado)

- **Serviços** em `packages/core/src/services/` (um arquivo por domínio):
  `produtos.service.ts`, `pedidos.service.ts`, `dashboard.service.ts`, `clientes.service.ts`,
  `agentes.service.ts`, `analytics.service.ts`. Todos usam `withTenant()`
  (`packages/db/src/tenant-context.ts`) + filtro `cliente_id` explícito (defesa em profundidade).
  **Regra de negócio importante que vive nesses arquivos: receita e gasto de cliente EXCLUEM
  pedidos com status `cancelado`** — isso é filtro em JS sobre o resultado da query, não uma
  cláusula SQL. Qualquer reescrita dessas funções precisa preservar esse filtro.
- **Rotas BFF** em `apps/web/app/api/*/route.ts` (produtos, pedidos, dashboard, clientes,
  agentes, analytics) — finas, Zod na fronteira (analytics valida `period`), bigint serializado
  via `apps/web/lib/serialize.ts`. Server Components **não** passam por essas rotas — chamam o
  serviço direto (`apps/web/lib/data/*.ts` importa de `@ai-commerce/core/src/services/*`); as
  rotas existem como superfície pública paralela para uso futuro client-side.
- **Seed determinístico e idempotente**: `packages/db/src/seed.ts` + `packages/db/src/dev-tenant.ts`
  (`DEV_CLIENTE_ID = '00000000-0000-0000-0000-000000000001'`, fixo, documentado, **nunca** deve
  ganhar um `throw`/validação que impeça seu import em produção — ver Incidente 2). Catálogo de
  5 SKUs de referência (`INF-1042`, `INF-2871`, `INF-0553`, `INF-3390`, `INF-0917`, da skill
  marketplace-domain), 4 compradores, 8 pedidos com status variados, 2 agentes com execuções.
- Resolução de tenant em `apps/web/lib/tenant.ts` (`getClienteIdAtual()`) — `TODO(F5)` marcado
  para trocar por sessão Auth.js quando existir.
- `apps/web/next.config.mjs`: externaliza `postgres` (server-only) e carrega `.env` da raiz do
  monorepo em dev/build local.
- As 6 telas (`/`, `/pedidos`, `/produtos`, `/agentes`, `/clientes`, `/analytics`) são
  `force-dynamic` e mostram dado real, **verificado ao vivo em produção** (não só localmente).

### Bug pós-merge encontrado e corrigido em produção (não fazia parte do PR #2)
Depois do deploy, a produção ficava com todas as telas vazias mesmo com `DATABASE_URL`
configurado. Causa: a conexão direta do Supabase é IPv6-only, e a Vercel não tem saída IPv6
(documentado pela própria Supabase, que cita a Vercel nominalmente). Corrigido em dois passos:
1. Trocar `DATABASE_URL` no painel da Vercel pela string do **Transaction Pooler** (Supavisor,
   porta 6543, sempre IPv4).
2. Commit `e2fe490`: adicionar `{ prepare: false }` na chamada `postgres()` em
   `packages/db/src/index.ts` — obrigatório porque o modo transaction do pooler não suporta
   prepared statements no nível de protocolo. **Esta linha é crítica — nunca remova
   `prepare: false` daquela chamada.**

## Incidente 2 — reimplementação em cima de branch desatualizado (revertido, não commitado)

Uma sessão do Antigravity reimplementou a F4.2 do zero sem sincronizar com a `main`, e por cima
reintroduziu a ausência do `prepare: false` acima, reverteu a regra "exclui cancelados" em
`dashboard.service.ts`/`clientes.service.ts`, e adicionou um `throw` a nível de módulo em
`dev-tenant.ts` que derrubaria a produção inteira. Nada disso chegou a ser commitado — auditado
e descartado. Ver `GUARDRAILS.md` e a regra 0/15/16 do `ANTIGRAVITY_RULES.md`. **Isso já foi
resolvido — não precisa re-investigar, só não repetir.**

---

## O que ainda NÃO existe (não invente que já existe)

- Auth.js/RBAC (F5 M5) — hoje é `DEV_CLIENTE_ID` fixo em todo lugar.
- Cripto de credenciais (F5.1) — colunas `payload_cifrado`/`iv`/`auth_tag` já existem na tabela
  `credencial` (`packages/db/src/schema/canal.ts`), mas nenhum cifrador foi implementado ainda.
- `regra_preco` e `tarefa` (F5.2, Governance Center) — tabelas não existem no schema ainda.
- Motor de decisão M3 / guardrails de IA (F5.3) — só o schema (`decisao`, `estadoDecisaoEnum`)
  existe; a máquina de estados e os guardrails em código não foram implementados.
- Worker (F6), motores de estoque/concorrência (F7), Bling real (F8), relatórios/hardening (F9).

---

## Bug pós-merge encontrado e corrigido — Incidente 3 (Auth.js sem AUTH_SECRET em produção)

O middleware (`apps/web/middleware.ts`) roda `auth()` do NextAuth em TODA rota (matcher exclui só
`/api/auth`, `_next/static`, `_next/image`, `favicon.ico`). Isso significa que, a partir do commit
que introduziu Auth.js, a variável `AUTH_SECRET` deixou de ser opcional — sem ela configurada no
ambiente do deployment, TODA página quebra com "server-side exception" (não só as de login).
`AUTH_SECRET` foi adicionada ao `.env.example` e gerada, mas o deployment em produção que rodou
antes de a variável ser configurada no painel da Vercel ficou no ar sem ela — site inteiro fora
do ar até o próximo build pegar a variável. Env var nova no painel da Vercel NUNCA se aplica a um
deployment já existente — precisa de um build novo (redeploy manual ou push com diff real; commit
vazio é ignorado pelo "ignored build step" da Vercel, que detecta "not affected" e pula o build).
Ver também `packages/db/apply_migration.js` no `.gitignore` — tinha connection string de produção
em texto plano, nunca chegou a ser commitado, mas quase foi.

## Incidente 4 — CREDENTIAL_ENCRYPTION_KEY com valor vazio/inválido na Vercel

Ao conectar Bling em produção, a mensagem era "Erro interno do servidor" (500 genérico).
Causa: `ChaveCriptografiaAusenteError` para chave ausente devolvia 503 claro, mas chave
configurada com valor incorreto (0 bytes após base64) lançava `Error` genérico → caia no
catch 500. Fix: `obterChave()` agora faz `.trim()` antes de decodificar e lança
`ChaveCriptografiaAusenteError` (com mensagem descritiva) para comprimento != 32 bytes.
Segundo problema: a variável foi adicionada na Vercel depois do último deploy, e commit
vazio é ignorado pelo "ignored build step" — precisa de diff real para forçar rebuild.
Regra adicionada: ao adicionar env var na Vercel, sempre fazer push de diff real logo após.

---

## Incidente 5 — pooler do Supabase não aceita role customizada (RLS via SET LOCAL ROLE)

Ao conectar Bling em produção, depois de corrigir a chave: `Erro interno (ENOTFOUND
tenant/user app_role.hxczjohoojfqwnanzvef not found)`. Progressão de causas:
1. `APP_DATABASE_URL` montada com host inexistente `<ref>.pooler.supabase.com` → DNS
   ENOTFOUND. No pooler do Supabase o ref vai no USUÁRIO, host é regional
   (`aws-0-sa-east-1.pooler.supabase.com`).
2. Corrigido o host, novo erro do Supavisor: `Tenant or user not found` para
   `app_role.<ref>` — **o pooler (porta 6543) só reconhece o usuário `postgres`**,
   não roles customizadas.
3. Mas `postgres` tem BYPASSRLS (confirmado em `pg_roles`) — usá-lo direto anularia
   o isolamento multi-tenant. `app_role` tem NOBYPASSRLS (correto), mas não conecta
   pelo pooler.

**Solução (a que vale a partir de agora):** a app conecta como `postgres` pelo pooler
e faz `SET LOCAL ROLE app_role` dentro de cada transação em `withTenant`
(`packages/db/src/tenant-context.ts`). Isso descarta o BYPASSRLS pela duração da
transação → RLS volta a valer (validado no banco real: tenant correto vê 5 produtos,
tenant errado vê 0). Pré-requisito no banco: `GRANT app_role TO postgres` (ver
`packages/db/supabase-bootstrap.sql`) — já aplicado em produção.

**Config de produção resultante:** `APP_DATABASE_URL` deve ser **igual** ao
`DATABASE_URL` (ambos conectam como `postgres` pelo pooler); o isolamento é garantido
pelo `SET LOCAL ROLE`, não por role de conexão distinta. Toda query de negócio DEVE
passar por `withTenant` — uma query direta em `db` fora dele roda como postgres e
ignora RLS (os filtros explícitos `cliente_id` em cada serviço são a defesa em
profundidade que cobre esse caso). A senha do `app_role` foi rotacionada durante o
diagnóstico (passou pelo chat) — **rotacionar de novo pós-demo**.

## Como manter este arquivo

Toda vez que uma fase for concluída e mergeada na `main`, adicione uma seção nova aqui (mesmo
formato das acima: o que foi criado, em que arquivo, qual regra de negócio importante vive ali)
e atualize "Estado agora" no topo. Se um bug for encontrado e corrigido em produção depois do
merge (como o do pooler), documente como uma subseção "Bug pós-merge encontrado e corrigido",
igual acima — isso é o que evita que a próxima sessão reintroduza o mesmo bug sem saber que ele
já existiu.
