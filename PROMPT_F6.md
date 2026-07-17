# PROMPT F6 — Worker de agentes (BullMQ/Redis): concluir e IMPLANTAR

> Cole no Antigravity depois de colar o bloco do `ANTIGRAVITY_RULES.md`. Branch nasce de
> **`main`** (F5.1, F5.2, F5.3, Auth.js/RBAC e o cofre de credenciais ERP já estão mergeados e
> validados ao vivo em produção — não existe mais um branch `feat/f5-3-...` em aberto).

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin main` e `git log origin/main --oneline -15`. Confirme que seu branch nasce
   do commit mais recente de `main`. Sem acesso a fetch: pergunte explicitamente qual é o commit
   de referência antes de tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md` (leia **até o fim** — tem 5 incidentes documentados,
   o mais recente é sobre o pooler do Supabase e afeta diretamente esta fase, ver item 3 abaixo),
   `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`, `./ROADMAP.md`.
2. `apps/worker/` **já existe** — não é para criar do zero. Leia `apps/worker/src/index.ts` e
   `apps/worker/src/workers/diagnostico.worker.ts` inteiros antes de tocar em qualquer coisa.
3. **Fato crítico de infraestrutura (Incidente 5 do `HISTORICO_PROJETO.md`)**: em produção, a
   aplicação conecta ao Postgres como usuário `postgres` (o pooler do Supabase/Supavisor, porta
   6543, só reconhece esse usuário) e `packages/db/src/tenant-context.ts` → `withTenant()` faz
   `SET LOCAL ROLE app_role` **dentro da transação** para restaurar o RLS (que `postgres` teria
   bypassado). Isso significa: **o worker herda esse comportamento automaticamente** por usar o
   mesmo `withTenant`/`db` de `@ai-commerce/db` — não precisa reimplementar nada, só precisa saber
   que existe, e que `APP_DATABASE_URL`/`DATABASE_URL` no ambiente do worker devem ser a MESMA
   string de conexão via pooler (não uma role customizada direta).

## Resumo do que JÁ EXISTE e está funcionando (não recomece, não reimplemente)

- **`apps/worker/`** é um app real no monorepo, `package.json` próprio (`"type": "module"`, ESM —
  necessário porque `ai`/`@ai-sdk/openai` são ESM-only), scripts `dev` (tsx watch), `build`
  (`tsc --noEmit`), `start` (`tsx src/index.ts`), `lint`, `typecheck`. BullMQ + ioredis + dotenv
  já são dependências declaradas.
- **`DiagnosticoWorker`** (`apps/worker/src/workers/diagnostico.worker.ts`): consome a fila
  `fila_diagnostico`, valida payload com Zod (`DiagnosticoPayloadSchema`), busca o produto via
  `withTenant` (com guard para produto inexistente — já corrigido), chama a **LLM real** (gpt-4o-mini
  via AI SDK, `packages/core/src/ai/diagnostico.agent.ts` — não é mock, já bate na API da OpenAI),
  grava a sugestão como uma `Decisao` real via `registrarDecisao`
  (`packages/core/src/ai/decisions.service.ts`, já filtra por `clienteId` — defesa em profundidade
  de tenant já aplicada).
- **Filas/idempotência já prontas** em `packages/core/src/jobs/`: `filas.ts` (nomes de fila +
  schemas Zod de `DIAGNOSTICO` e `SYNC_ERP`), `client.ts` (`enfileirarJob` — usa `jobId` do BullMQ
  = hash SHA-256 de `clienteId + payload`, então reprocessar o mesmo payload não duplica, regra 7
  do AGENTS.md já satisfeita), `idempotencia.ts` (`gerarIdIdempotencia`).
- **Motor de decisão + guardrails (F5.3)** já existe e é o que toda decisão de preço passa —
  `packages/core/src/decisions/maquina-estados.ts` + `guardrails.ts`. O worker atual só gera
  decisões de diagnóstico de conteúdo (sem preço), então não aciona guardrail de preço ainda —
  mas qualquer job futuro que sugerir preço DEVE passar por `transitarDecisao`, nunca gravar
  `decisao.estado` direto.
- **Cofre de credenciais ERP (F5.1 + F8-prep)**: `packages/core/src/services/integracoes.service.ts`
  já cifra/decifra com AES-256-GCM, testado com chave real em produção hoje. `obterCredencialErp`
  já existe e é o que um adapter real de ERP (F8) vai chamar — não crie um caminho de cripto novo.
- **Auth.js + RBAC (M5, antes listado como pendência do F5)** já está implementado e em produção:
  login, cadastro/onboarding, `middleware.ts` injeta `x-tenant-id`/`x-user-role`/`x-user-id`,
  `apps/web/lib/tenant.ts` lê desses headers. **Isso já estava fora do escopo original desta
  fase, mas está pronto — não precisa fazer nada aqui, só saber que existe.**

## O que REALMENTE falta nesta fase (o gap real, não o que os prompts antigos assumiam)

1. **Implantação do worker em algum host que rode processo long-lived** — Vercel (onde `apps/web`
   está) **não suporta isso**, é serverless. Antes de codar, pare e pergunte ao usuário onde o
   worker vai rodar (Railway, Fly.io, Render, uma VM, etc.) — isso é decisão de infraestrutura/custo,
   não técnica, e o `AGENTS.md` pede para não decidir sozinho. Depois de decidido: `Dockerfile` (ou
   config equivalente da plataforma escolhida) + variáveis de ambiente (`APP_DATABASE_URL`,
   `DATABASE_URL`, `REDIS_HOST`/`REDIS_PORT`, `OPENAI_API_KEY` se ainda não estiver lá, `NODE_ENV=production`).
2. **Redis gerenciado em produção** — hoje só existe `docker-compose.yml` local. Precisa de um
   Redis real (Upstash, Redis Cloud, ou o Redis da mesma plataforma do worker) antes do deploy.
3. **Job types que ainda não existem**: `SYNC_ERP` já tem fila + schema Zod prontos
   (`packages/core/src/jobs/filas.ts`), mas **nenhum worker consome essa fila ainda** — só
   `DIAGNOSTICO` tem worker. Implemente um worker novo (`apps/worker/src/workers/sync-erp.worker.ts`)
   que: lê a conexão ERP via `listarConexoesErp`/`obterCredencialErp`
   (`integracoes.service.ts`), chama o adapter mock de ERP (`packages/integrations/src/mock/bling.mock.ts`
   — real só na F8), persiste em `produto`/`estoque`/`produto_espelho` via `withTenant`.
4. **Kill switch (`cliente.aiExecutionEnabled`, já existe a coluna)**: os workers atuais não
   checam essa flag antes de rodar. Adicione a checagem no início de cada worker — se desligada,
   o job deve ser marcado como pulado (não como falha), com log claro do motivo.
5. **Scheduler**: nenhum agendamento automático existe (nem precisa ser cron de produção agora —
   basta o job ser re-executável manualmente via `enfileirarJob`, prova de pipeline fim-a-fim).
6. **Agente de marketplace (Mercado Livre)**: citado no roadmap original, mas nenhum código dele
   existe ainda — só o adapter mock (`packages/integrations/src/mock/mercadolivre.mock.ts`).
   Priorize `SYNC_ERP` antes deste se o tempo apertar (ERP é a fonte da verdade, conforme o
   princípio do PO no `ROADMAP.md`).

## O que esta fase NÃO inclui

- Adapter real do Bling/ML — continua mock (isso é F8, e só pode começar com credenciais OAuth2
  do Bling confirmadas pelo usuário).
- Motor de estoque/concorrência (F7).

## DoD

```
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Verde para o monorepo inteiro (incluindo `apps/worker`). Mais: prova de que o worker novo
(`sync-erp.worker.ts`) roda manualmente ponta a ponta contra Redis local/docker e o mock de ERP,
com query no banco mostrando os dados persistidos (cole o output ou screenshot). Se a implantação
em produção (item 1) não fechar no tempo disponível, documente em `task.md` exatamente até onde
chegou — não deixe isso implícito.

## Fluxo obrigatório

1. `implementation_plan.md`/`task.md` — pare para aprovação, incluindo a decisão de onde o worker
   vai rodar em produção (isso não é opcional, é uma pergunta real de infraestrutura).
2. Branch: `feat/f6-worker-sync-erp`, a partir de `main`.
3. **Não commite** — DoD verde, chame o Claude Code para auditar o diff completo antes do
   commit/PR (regra 3 do modelo de colaboração no `ANTIGRAVITY_RULES.md`).
4. Ambiguidade de regra de negócio ou de infraestrutura (onde roda o Redis/worker em produção,
   formato exato do payload de sync): pare e pergunte, não invente.
