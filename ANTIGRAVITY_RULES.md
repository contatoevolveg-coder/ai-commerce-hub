# ANTIGRAVITY_RULES.md — Enquadramento operacional para o Antigravity

> Cole este bloco no **início de toda sessão** do Antigravity neste projeto (antes do prompt
> da fase, junto do BLOCO 0). Ele não redefine a constituição do projeto — reforça como o
> Antigravity deve *operar* sobre arquivos existentes, porque já tivemos TRÊS incidentes reais:
> (1) uma sessão sobrescreveu parcialmente ~11 arquivos com versões mais antigas/pobres enquanto
> o resto do código já esperava a versão nova, quebrando o typecheck (30+ erros) e reintroduzindo
> o bug do alias `@/lib/utils`; (2) uma sessão reimplementou a F4.2 inteira em cima de um branch
> que ela mesma tinha deixado desatualizado, sem sincronizar com a `main`, reintroduzindo um bug
> de produção já corrigido (pooler do Supabase) e adicionando um `throw` que derrubaria o site
> inteiro se fosse deployado; (3) uma sessão implementou Auth.js (login + cadastro de loja) sem
> perceber que as tabelas `usuario`/`cliente` têm RLS forçado — o `authorize()` e o
> `registerTenant()` liam/escreviam via `db` direto (fora de `withTenant`), o que faz login e
> cadastro falharem 100% das vezes em produção assim que a role `app_role` (não-superusuário)
> está configurada; a mesma sessão também trocou validações Zod por `as any` em 3 lugares para
> silenciar erro de tipo, o que quebrou o `next build` (ESLint `no-explicit-any` já era regra
> existente, mas a sessão não rodou `pnpm build`/`pnpm lint` antes de declarar pronto — violação
> da Regra 6 abaixo, não falta de regra). Documentado em `GUARDRAILS.md`. Este arquivo existe
> para que isso não se repita.

---

## Bloco para colar no Antigravity (início de toda sessão)

```
ANTES DE LER QUALQUER ARQUIVO .md, SINCRONIZE O GIT (causa do incidente 2):
0. Rode `git fetch origin main` e `git log origin/main --oneline -10`. Compare com o branch em
   que você está. Se `origin/main` tem commits que seu branch local não tem, PARE — não comece
   a trabalhar em cima de estado desatualizado. Diga ao usuário/ao Claude Code em qual commit
   você está baseando o trabalho e peça confirmação de que é o estado atual antes de prosseguir.
   Se você não tem acesso a `git fetch` no seu ambiente, PERGUNTE explicitamente "qual é o commit
   mais recente da main agora?" antes de tocar em qualquer arquivo — não assuma que o que você
   vê localmente é o estado atual do projeto.

Depois disso, leia nesta ordem:
- ./AGENTS.md            (constituição: stack, regras invioláveis, fluxo obrigatório)
- ./HISTORICO_PROJETO.md (o que já foi feito, fase a fase, com detalhe de arquivo e regra de
                          negócio — leia ANTES de reescrever qualquer service/query existente)
- ./GUARDRAILS.md        (padrões de falha já observados — inclui os 2 incidentes de sobrescrita)
- ./ROADMAP.md           (onde estamos, o que falta, prioridade)
- ./implementation_plan.md e ./task.md (se existirem, são o plano em andamento)

Se o que você lê em ./HISTORICO_PROJETO.md não bater com o que existe de fato no repositório
(arquivo citado não existe, ou existe diferente do descrito), PARE e avise — o histórico está
desatualizado, não confie nele cegamente, mas também não ignore: avise para ser corrigido.

Se qualquer instrução minha contradisser esses arquivos, ESSES arquivos vencem. Pare e me avise.

REGRAS DE EDIÇÃO DE ARQUIVO EXISTENTE (a causa do incidente anterior):
1. Antes de criar ou regenerar um arquivo que JÁ EXISTE, leia o conteúdo atual primeiro.
   Sua nova versão precisa ser um SUPERSET compatível com o que já compila — nunca uma
   reescrita isolada que ignora quem já consome esse arquivo.
2. Prefira editar em cima do que existe (patch/diff) a reescrever o arquivo inteiro do zero.
   Se precisar reescrever, releia todos os arquivos que importam o que você está mudando
   (tipos, exports, assinaturas de função) e mantenha compatibilidade ou atualize os dois lados.
3. Em `packages/ui/src/index.ts`: só ADICIONE exports. Nunca remova um export existente sem
   grep confirmando que nada em `apps/web` o usa.
4. Em `packages/ui/src/components/*`: importe `cn` de `"../lib/utils"` (relativo). NUNCA de
   `"@/lib/utils"` — esse alias resolve contra o tsconfig do app consumidor, não do pacote, e
   quebra o bundle mesmo quando o typecheck isolado do pacote passa.
5. Em `apps/web/lib/types.ts`: é aditivo por padrão. Remover ou estreitar um campo/tipo exige
   grep em todo `apps/web` confirmando que nenhuma tela/componente depende do campo removido.

REGRAS DE VERIFICAÇÃO (não é "pronto" sem isto, sempre, sem exceção):
6. Depois de QUALQUER mudança em `packages/*` ou `apps/web`, rode:
   pnpm typecheck && pnpm lint && pnpm test && pnpm build
   Cole a saída real. Se algo quebrar, corrija ANTES de dizer que terminou — não deixe
   vermelho para a próxima sessão resolver.
7. Rode `git status` e `git diff` no final e revise: seu diff deve conter APENAS as mudanças
   pretendidas. Se aparecer uma mudança em arquivo que você não pretendia tocar, investigue
   antes de commitar — provavelmente é uma regressão como a do incidente anterior.
8. Nunca use `any` como atalho para "não sei o tipo ainda" (regra 1 do AGENTS.md). Defina o
   tipo real em `apps/web/lib/types.ts` ou no pacote correspondente.

REGRAS DE ESCOPO E DEPENDÊNCIAS:
9. Dependência nova: PROPONHA e ESPERE aprovação (regra do AGENTS.md). Não rode
   pnpm add/install por conta própria.
10. Trabalhe uma fase por vez (F3, F4, F5...), conforme o ROADMAP.md. Não abra frentes de
    fases futuras "de brinde" — isso é o que faz a meta de prazo escorregar.
11. Migration destrutiva, alteração de .env/docker-compose, ou tocar em branch main
    diretamente: NUNCA sem perguntar primeiro.

FLUXO OBRIGATÓRIO (já é regra do AGENTS.md, reforçando):
12. Produza implementation_plan.md / task.md e pare para aprovação ANTES de codar.
13. Um branch por fase. Conventional Commits, corpo em português.
14. Se encontrar ambiguidade de regra de negócio (taxa, comissão, fórmula), PARE e pergunte.
    Não invente valor.

REGRA DE SINCRONIZAÇÃO (causa do incidente 2 — ver regra 0 no topo deste bloco):
15. Nunca reescreva uma query/service já existente "do zero" achando que está melhorando —
    se o arquivo já compila e já foi validado (typecheck/lint/test/build verdes, ou pior, já
    testado ao vivo em produção), qualquer reescrita precisa preservar TODO comportamento
    observável documentado em comentários/docstrings do arquivo original — especialmente
    regras de negócio como "exclui cancelados", "filtra por status X". Se o comentário some
    na sua reescrita, a regra provavelmente some com ele. Não troque filtro em JS por
    agregação SQL (ou vice-versa) sem primeiro listar, em texto, quais regras de negócio o
    código atual aplica — e confirmar que a nova versão aplica as mesmas.
16. `throw`/lançar erro no nível de módulo (fora de função) baseado em `NODE_ENV` ou qualquer
    variável de ambiente é proibido, a menos que combinado explicitamente. Isso executa no
    import do módulo, não quando alguém de fato usa o valor errado — derruba a aplicação
    inteira em produção mesmo que o valor nunca seja mal utilizado.

REGRA DE RLS E TENANT (causa do incidente 3):
17. TODA tabela que tem `FORCE ROW LEVEL SECURITY` (grep `FORCE ROW LEVEL SECURITY` nas
    migrations pra ver quais são — hoje inclui `cliente`, `usuario`, `decisao`, `tarefa`,
    `conexao_erp`, entre outras) só pode ser lida/escrita através de `withTenant(clienteId, ...)`
    (que seta `app.current_cliente_id` na sessão) OU do cliente administrativo dedicado descrito
    abaixo. NUNCA importe `db` de `@ai-commerce/db` e rode `db.select/insert/update` direto numa
    dessas tabelas em código de aplicação (rotas, services, actions) — isso compila e passa no
    `tsc`, mas em produção (onde `APP_DATABASE_URL` aponta pra uma role sem `BYPASSRLS`) a query
    retorna 0 linhas ou viola o `WITH CHECK` da policy, silenciosamente.
    Exceção conhecida e documentada: fluxos de bootstrap SEM tenant ainda resolvido (login,
    criação de conta/onboarding) legitimamente precisam de acesso administrativo — para esses,
    use o cliente admin dedicado (ver prompt de correção do incidente 3), nunca `db` genérico.
18. Antes de declarar qualquer tarefa "pronta", rode os 4 comandos da Regra 6
    (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) e cole a saída real de TODOS,
    não só do `tsc`. `tsc --noEmit` NÃO pega erro de ESLint (ex. `no-explicit-any`) nem erro que
    só aparece no build do Next.js — só `pnpm build` roda o lint-no-build do Next e pega isso.
    "Typecheck passou" não é sinônimo de "pronto".
```

---

## Por que cada regra existe (contexto do incidente, para quem for revisar depois)

| Regra | O que aconteceu sem ela |
|---|---|
| 1–2 (superset, não reescrita isolada) | `types.ts`, `index.ts` e 4 componentes de `packages/ui` foram regenerados numa versão mais pobre, enquanto as 6 telas em `apps/web` já esperavam a versão nova — 30+ erros de tipo. |
| 3 (só adicionar export) | `Input`, `Field`, `BarChart` desapareceram do barrel `index.ts` sem grep prévio — quebrou `FilterBar`, `ConfigView`, `analytics` silenciosamente (só apareceu no `tsc` do `web`, não no do `ui`). |
| 4 (alias relativo em `packages/ui`) | `Card`, `EmptyState`, `PageHeader`, `Skeleton` voltaram a importar `@/lib/utils` — o mesmo bug que já tinha derrubado o build da Vercel antes, reintroduzido. |
| 5 (types.ts aditivo) | `Kpi.label`, `Order.channel`, `AiAgent.id/description` foram removidos do tipo enquanto os componentes que os liam continuavam iguais. |
| 6–7 (verificar sempre, revisar diff) | O problema só foi descoberto porque o usuário rodou `pnpm typecheck` manualmente depois — se não tivesse rodado, o próximo push quebraria o deploy de novo. |
| 0, 15 (sincronizar git, preservar regra de negócio) | Uma sessão reimplementou a F4.2 em cima de branch desatualizado, sem saber que aquele trabalho já tinha sido revisado e corrigido. Reintroduziu a ausência de `prepare: false` (bug do pooler já corrigido) e removeu a regra "receita exclui cancelados" em 3 funções ao trocar filtro JS por SQL. |
| 16 (nunca `throw` no nível de módulo por env) | `dev-tenant.ts` ganhou `if (NODE_ENV === 'production') throw` fora de função — derrubaria a aplicação inteira (500 em toda rota) no primeiro deploy, porque o módulo é importado por toda página, não só onde o valor seria mal utilizado. |
| 17 (RLS só via `withTenant` ou cliente admin dedicado) | `auth.ts` (`authorize()`) e `actions.ts` (`registerTenant()`) usaram `db` direto em tabelas com `FORCE ROW LEVEL SECURITY`. Login sempre retornava "credenciais inválidas" (a busca por email via RLS sem `app.current_cliente_id` setado retorna 0 linhas) e o cadastro de loja sempre falhava no insert (viola `WITH CHECK`). Passou no `tsc` porque é um erro de dado em runtime, não de tipo — só apareceu ao ler a policy de RLS e confirmar que `app_role` não tem `BYPASSRLS`. |
| 18 (rodar os 4 comandos, não só `tsc`) | A mesma sessão trocou 3 validações Zod por `as any` pra silenciar erro de tipo. `tsc --noEmit` passou limpo (a regra de `any` é do ESLint, não do compilador). `pnpm build` — que já era exigido pela Regra 6 — falhava direto com `Unexpected any. Specify a different type.` Só foi descoberto porque alguém rodou `pnpm build` manualmente depois. |

---

## Modelo de colaboração (Antigravity executa, Claude Code revisa/aprova/desbloqueia)

A partir de agora, o fluxo do projeto é este — não é ambos os agentes codando em paralelo:

1. **Claude Code (esta sessão/arquivo) escreve o prompt de execução da fase** (ex.
   `PROMPT_F5_1.md`), já ancorado no estado real do repositório (schema, arquivos existentes,
   convenções) — não um prompt genérico.
2. **Antigravity executa** o prompt: plano → aprovação → código → DoD.
3. **Antes de qualquer commit/PR, Claude Code audita o diff completo** (não só o resumo que o
   Antigravity reporta) contra o estado real da `main` — exatamente como a auditoria que gerou
   este bloco. Só aprova pra commit/merge o que sobrevive a essa auditoria.
4. **Quando o Antigravity travar** — sem terminal para rodar `pnpm`, sem token, sem acesso a
   git/Supabase/Vercel, ou qualquer bloqueio de ambiente — **Claude Code assume a execução
   direta** daquele passo específico (não a fase inteira, só o que travou) e devolve o controle
   pro Antigravity quando destravar, ou finaliza a fase se fizer mais sentido.
5. **Antigravity nunca decide sozinho tocar em `AGENTS.md`, `ANTIGRAVITY_RULES.md`,
   `GUARDRAILS.md` ou `ROADMAP.md`** — esses arquivos são a constituição/processo do projeto.
   Mudança neles é proposta ao usuário (via Claude Code ou diretamente), nunca commitada como
   parte de uma tarefa de feature.

---

## Nota sobre este arquivo

O Antigravity não lê automaticamente arquivos de regra deste repositório (verificado: só existe
`.antigravityignore`, que é só padrão de exclusão, não instrução). **Este bloco precisa ser
colado manualmente no início de cada sessão** até/a menos que o Antigravity passe a suportar
um arquivo de regras nativo — se isso mudar, mover o conteúdo do bloco acima para o formato
nativo correspondente.

## O que também virou verificação automática (não depende mais de colar o prompt)

As regras 3, 4 e 6 acima agora são checadas **por máquina**, não só por instrução em texto:

- **Regra 4** (alias `@/lib/utils` em `packages/ui`): ESLint (`no-restricted-imports` em
  `packages/ui/.eslintrc.js`) falha o build se esse padrão aparecer. Testado empiricamente —
  pega o erro exato do incidente.
- **Regra 6** (rodar typecheck/lint sempre): `packages/ui` e `packages/integrations` ganharam
  script `lint` (antes não tinham nenhum — era por isso que o bug do alias passou despercebido
  da primeira vez). `apps/web/.eslintrc.json` ganhou as regras de dinheiro/`any` que antes só
  existiam na raiz e nunca rodavam nele.
- **Git hook** (`.githooks/pre-commit`, instalado automaticamente por `pnpm install` via script
  `prepare`): roda `pnpm typecheck && pnpm lint` antes de todo commit e **bloqueia** se algo
  falhar. `pnpm test`/`pnpm build` ficam fora do hook (lentos demais por commit) — continuam
  rodando no CI a cada push.

Isso significa: mesmo que alguém esqueça de colar este prompt no Antigravity, o padrão exato
do incidente anterior não consegue mais ser commitado silenciosamente.
