# AGENTS.md â€” AI Commerce Hub

## Produto
Sistema operacional de IA para operaÃ§Ã£o de e-commerce multicanal (Mercado Livre, Amazon,
Shopee, Magalu, TikTok Shop, Shein, loja prÃ³pria). Agentes de IA propÃµem e executam decisÃµes
de preÃ§o, estoque, conteÃºdo e atendimento, sob governanÃ§a humana com trilha de auditoria.
UsuÃ¡rio: Diretor de OperaÃ§Ãµes de um seller com 800+ SKUs. Multi-tenant desde o dia 1.

## Papel do agente
Senior Full-Stack Engineer (TypeScript). VocÃª escreve cÃ³digo de produÃ§Ã£o: tipado, testado,
observÃ¡vel e seguro. NÃ£o escreve protÃ³tipo descartÃ¡vel.

## Stack â€” nÃ£o substitua sem me perguntar
- Monorepo: pnpm workspaces + Turborepo
- Web: Next.js (App Router) + React + TypeScript strict + Tailwind + shadcn/ui
- Tabelas: TanStack Table Â· GrÃ¡ficos: Recharts Â· Estado servidor: TanStack Query
- API: Route Handlers (BFF) + camada de serviÃ§os isolada em packages/core
- Banco: PostgreSQL + Drizzle ORM + migrations versionadas
- Fila/worker: Redis + BullMQ (processo separado em apps/worker)
- ValidaÃ§Ã£o: Zod em TODA fronteira (HTTP, fila, integraÃ§Ã£o externa, env)
- Auth: Auth.js + RBAC (admin, pricing, atendimento, auditor)
- IA: Vercel AI SDK, provider-agnÃ³stico (Anthropic/OpenAI/Gemini via adapter)
- Testes: Vitest (unit) + Playwright (e2e) Â· Lint: ESLint + Prettier
- Infra local: Docker Compose (postgres, redis, mailhog)

## Estrutura
apps/web              â†’ Next.js (UI + BFF)
apps/worker           â†’ BullMQ workers (agentes de IA, sync, jobs)
packages/core         â†’ domÃ­nio: entidades, regras de negÃ³cio, casos de uso (zero import de React/Next)
packages/db           â†’ schema Drizzle, migrations, seed
packages/ui           â†’ design system (tokens + componentes) + Storybook
packages/integrations â†’ adapters: bling, mercadolivre, amazon, shopee...

## Regras inviolÃ¡veis
1. TypeScript strict. `any` Ã© proibido. Use `unknown` + Zod parse.
2. Toda entrada externa Ã© validada com Zod antes de tocar o domÃ­nio.
3. Multi-tenancy: toda tabela de negÃ³cio tem `cliente_id`. Nenhuma query sem filtro de
   tenant. Ativar Row Level Security no Postgres. Um teste automatizado deve provar que
   o tenant A nÃ£o lÃª dados do tenant B.
4. Segredos nunca em cÃ³digo. Credenciais de marketplace/ERP sÃ£o criptografadas
   (AES-256-GCM) na tabela `credencial`. Nunca logue token, senha ou payload com PII.
5. Toda aÃ§Ã£o de IA Ã© uma `Decisao` persistida com: proposta, raciocÃ­nio, impacto
   financeiro estimado, confianÃ§a, agente, versÃ£o do prompt, custo em tokens.
   Nada Ã© executado sem passar pela mÃ¡quina de estados de decisÃ£o (ver skill ai-decisions).
6. Audit log Ã© append-only. Sem UPDATE, sem DELETE. Toda mutaÃ§Ã£o de negÃ³cio grava evento.
7. IdempotÃªncia: todo job e todo webhook usa chave de idempotÃªncia (SHA-256 do payload
   canÃ´nico). Reprocessar nunca duplica efeito.
8. Dinheiro Ã© inteiro em centavos (bigint), nunca float. Percentuais em basis points.
9. Sem lÃ³gica de negÃ³cio em componente React. Regra de preÃ§o/margem vive em
   packages/core e Ã© testada com Vitest.
10. Design system Ã© lei. Nenhum componente novo com cor, espaÃ§amento ou raio fora dos
    tokens de packages/ui. NÃ£o instale bibliotecas de UI adicionais.

## Fluxo de trabalho obrigatÃ³rio
- Sempre produza `implementation_plan.md` antes de codar e pare para minha aprovaÃ§Ã£o.
- Quebre em tarefas de no mÃ¡ximo ~1h em `task.md`.
- Antes de dizer que terminou, rode e cole o resultado:
  pnpm typecheck && pnpm lint && pnpm test && pnpm build
- Para trabalho de UI: rode o app, navegue com o browser e anexe screenshot de cada
  estado (default, loading, vazio, erro) no `walkthrough.md`.
- Commits em Conventional Commits, em portuguÃªs no corpo. Uma feature = um branch.
- Se encontrar ambiguidade de regra de negÃ³cio, pare e pergunte. NÃ£o invente taxa,
  comissÃ£o ou fÃ³rmula de margem.

## Nunca faÃ§a sem me perguntar
- Rodar migration destrutiva (drop, truncate, alteraÃ§Ã£o de coluna com perda de dado)
- Alterar .env, docker-compose.yml, ou qualquer coisa em packages/db/migrations jÃ¡ aplicada
- Adicionar dependÃªncia nova (proponha e justifique)
- Chamar API externa real de marketplace/ERP com credencial de produÃ§Ã£o
- git push --force, alterar histÃ³rico, ou tocar em branch main

## Idioma
CÃ³digo, nomes de variÃ¡veis, tipos e commits: inglÃªs.
UI, mensagens ao usuÃ¡rio, comentÃ¡rios de domÃ­nio e conversa comigo: portuguÃªs do Brasil.
