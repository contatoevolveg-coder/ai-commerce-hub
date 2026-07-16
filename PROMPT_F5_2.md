# PROMPT F5.2 — `regra_preco` + `tarefa` + Governance Center

> Cole este prompt no Antigravity. **Importante sobre branch**: o F5.1 (cripto) já está pronto e
> auditado, mas **ainda não foi mergeado na `main`** — por decisão do usuário, os merges desta
> leva de fases (F5.x) vão ser feitos todos juntos no final. Por isso:
> - Seu branch de trabalho deve nascer de `feat/f5-1-cripto-credenciais` (não de `main`).
> - `git fetch origin feat/f5-1-cripto-credenciais` e confirme que seu branch local contém aquele
>   commit antes de começar (mesma lógica da regra 0, só que a referência não é mais `main`).

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin feat/f5-1-cripto-credenciais` e confirme que seu branch nasce dali.
   Se não tiver acesso a fetch, pergunte explicitamente qual é o commit de referência antes de
   tocar em qualquer arquivo.
1. `./AGENTS.md` — constituição.
2. `./HISTORICO_PROJETO.md` — o que já existe (**nota**: este arquivo só é atualizado quando
   algo é mergeado na `main`; o F5.1 ainda não aparece lá porque está em PR aberto — considere-o
   como já pronto mesmo assim, é o branch-base desta fase).
3. `./ANTIGRAVITY_RULES.md` — regras de edição segura (15: preservar regra de negócio ao
   reescrever; 16: nunca `throw` no nível de módulo por env var).
4. `./GUARDRAILS.md`, `./ROADMAP.md` (seção F5.2), `.agents/skills/design-system/SKILL.md`,
   `.agents/skills/ai-decisions/SKILL.md`.

---

## Resumo do que já existe (para não se perder)

- Schema com 21 entidades, multi-tenant + RLS. Relevantes aqui: `decisao` e `agente`
  (`packages/db/src/schema/ia.ts`, com `estadoDecisaoEnum`: proposed → auto_approved/pending_review
  → approved → executing → executed, ramos rejected/failed→retry/dead_letter/rollback) e `papel`
  (`packages/db/src/schema/cliente.ts`, `papelCodigoEnum`: admin, pricing, atendimento, auditor).
- Camada de serviço em `packages/core/src/services/` (um arquivo por domínio, todos via
  `withTenant()`), telas ligadas a dado real em produção.
- Cripto de credenciais em `packages/core/src/crypto/credencial.ts` (F5.1, branch atual).
- **Design system** (`packages/ui/src/components/`) hoje só tem: `Button`, `Badge`, `StatCard`,
  `MiniChart`, `Input`, `Field`, `BarChart`, `Card`, `EmptyState`, `PageHeader`, `Skeleton`,
  `DataTable`. **`AIDecisionCard`, `ConfidenceMeter`, `Money` NÃO existem ainda** — a skill
  design-system os lista como obrigatórios; esta fase precisa criá-los, não improvisar um card
  fora do padrão.
- Navegação em `apps/web/components/Shell.tsx` (`navItems`, array simples com `name`/`href`/`icon`
  do `lucide-react`) — hoje: Dashboard, Pedidos, Produtos, Agentes IA, Clientes, Analytics,
  Configurações.

---

## Escopo do F5.2

### 1. Schema novo (gere migration com `drizzle-kit generate`, não escreva SQL à mão)

`packages/db/src/schema/governanca.ts` (arquivo novo):

```ts
export const tarefaTipoEnum = pgEnum('tarefa_tipo', [
  'aprovacao_decisao', 'diagnostico_cadastro', 'divergencia_estoque', 'outro',
])
export const tarefaStatusEnum = pgEnum('tarefa_status', [
  'aberta', 'em_andamento', 'concluida', 'cancelada',
])

export const regraPreco = pgTable('regra_preco', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id').notNull().references(() => cliente.id, { onDelete: 'cascade' }),
  canalId: uuid('canal_id').references(() => canal.id, { onDelete: 'cascade' }), // null = regra global do cliente
  categoria: text('categoria'), // null = todas categorias
  margemMinimaBps: bigint('margem_minima_bps', { mode: 'bigint' }).notNull(),
  descontoMaximoBps: bigint('desconto_maximo_bps', { mode: 'bigint' }).notNull(),
  vigenteDe: timestamp('vigente_de', { withTimezone: true }).notNull(),
  vigenteAte: timestamp('vigente_ate', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [tenantIsolationPolicy('regra_preco_tenant_isolation')]).enableRLS()

export const tarefa = pgTable('tarefa', {
  id: uuid('id').defaultRandom().primaryKey(),
  clienteId: uuid('cliente_id').notNull().references(() => cliente.id, { onDelete: 'cascade' }),
  tipo: tarefaTipoEnum('tipo').notNull(),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  decisaoId: uuid('decisao_id').references(() => decisao.id),
  responsavelId: uuid('responsavel_id').references(() => usuario.id),
  prazo: timestamp('prazo', { withTimezone: true }),
  status: tarefaStatusEnum('status').notNull().default('aberta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [tenantIsolationPolicy('tarefa_tenant_isolation')]).enableRLS()
```

Ajuste imports/nomes de coluna pro padrão exato dos arquivos vizinhos (`ia.ts`, `canal.ts`) —
segue o mesmo estilo, snake_case no banco, camelCase no Drizzle. Adicione o export em
`packages/db/src/schema/index.ts` (aditivo — `export * from './governanca'`).

Rode `pnpm db:generate` e `pnpm db:push` contra o Supabase configurado, mesmo fluxo do M1.

### 2. Serviço

`packages/core/src/services/governanca.service.ts`:
- `listarTarefas(clienteId)`, `criarTarefa(clienteId, dados)`.
- `aprovarTarefa(clienteId, tarefaId, atorPapel)`: se `atorPapel === 'auditor'`, **rejeite com
  erro explícito antes de tocar o banco** (auditor só audita, nunca aprova — regra do PO/AGENTS.md).
  Caso contrário, transiciona `decisao.estado` (se `tarefa.decisaoId` existir) e marca
  `tarefa.status = 'concluida'`, gravando em `audit_log` (append-only, já validado no schema).
- `rejeitarTarefa(clienteId, tarefaId, motivo)`: idem, grava em `audit_log`.
- Papel do ator: como Auth.js ainda não existe (F5 M5, fora de escopo), resolva via env/header
  de dev documentado como TEMPORÁRIO — mesmo padrão do `DEV_CLIENTE_ID` (`apps/web/lib/tenant.ts`).
  **Preserve esse padrão, não invente um mecanismo novo de auth.**

### 3. Componentes de design system (novos, em `packages/ui/src/components/`)
- `Money.tsx`: formata bigint centavos → string BRL. **Reaproveite a lógica de
  `apps/web/lib/format.ts` → `formatBRL`** (não duplique a fórmula — se fizer sentido, mova a
  função pra cá e faça `apps/web/lib/format.ts` reexportar, mas sem quebrar os imports existentes
  em `apps/web/lib/data/*.ts`).
- `ConfidenceMeter.tsx`: barra + percentual (0–100).
- `AIDecisionCard.tsx`: contrato fixo da skill design-system, nesta ordem: (1) diff visual valor
  antigo riscado (`text-muted`) → valor novo (`text-primary`), (2) raciocínio em bloco com borda
  esquerda `accent/ai`, (3) impacto financeiro (± R$ e ± p.p.), (4) `ConfidenceMeter`, (5) ações
  `[Aprovar] [Rejeitar e treinar]`. Nunca renderize sem os 5 elementos.

Exporte os 3 no barrel `packages/ui/src/index.ts` (aditivo — só adicione, não toque no resto).

### 4. Tela nova
- `apps/web/app/governanca/page.tsx`: lista de tarefas (usar `DataTable` existente), com
  `AIDecisionCard` para tarefas do tipo `aprovacao_decisao` que tenham `decisaoId`.
- Item de navegação em `apps/web/components/Shell.tsx` → `navItems`: **adicione** um item
  "Governança" (ícone `lucide-react`, ex. `ShieldCheck`) — não reescreva o array, só adicione
  uma entrada.
- Estado vazio (`EmptyState`, já existe) quando não há tarefas.

### 5. Seed
Adicione ao `packages/db/src/seed.ts` (arquivo existente, edite — não recrie): 2-3 `tarefa` de
exemplo para o tenant demo (`DEV_CLIENTE_ID`), pelo menos uma vinculada a uma `decisao` fictícia
(crie a `decisao` mínima necessária também, com os campos obrigatórios da skill ai-decisions:
`agente_id`, `versao_prompt`, `modelo`, `input_hash`, `proposta`, `raciocinio`,
`impacto_estimado_centavos`, `confianca`, `estado`).

## O que esta fase NÃO inclui
- Auth.js real — continue com o padrão de dev temporário já estabelecido.
- Motor de decisão / guardrails de verdade (máquina de estados, preço-piso) — isso é F5.3.
- Não toque em `packages/integrations` nem em `packages/core/src/crypto`.

## DoD
```
pnpm db:generate && pnpm db:push
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Verde, mais: suba `pnpm dev`, navegue até `/governanca`, confirme que a tarefa de exemplo aparece
com o `AIDecisionCard` renderizando os 5 elementos, screenshot em `walkthrough.md`.

## Fluxo obrigatório
1. `implementation_plan.md`/`task.md` — pare para aprovação antes de codar.
2. Branch: `feat/f5-2-governanca`, **a partir de `feat/f5-1-cripto-credenciais`** (não `main`).
3. **Não commite ainda** — DoD verde, me chame para auditar o diff antes do commit/PR, mesmo
   fluxo do F5.1.
4. Ambiguidade de regra de negócio (ex. o que exatamente diagnostico_cadastro deveria verificar):
   pare e pergunte, não invente.
