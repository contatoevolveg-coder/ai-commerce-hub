# ANTIGRAVITY_RULES.md — Enquadramento operacional para o Antigravity

> Cole este bloco no **início de toda sessão** do Antigravity neste projeto (antes do prompt
> da fase, junto do BLOCO 0). Ele não redefine a constituição do projeto — reforça como o
> Antigravity deve *operar* sobre arquivos existentes, porque já tivemos um incidente real:
> uma sessão anterior sobrescreveu parcialmente ~11 arquivos com versões mais antigas/pobres
> enquanto o resto do código já esperava a versão nova, quebrando o typecheck (30+ erros) e
> reintroduzindo o bug do alias `@/lib/utils` que já havia sido corrigido. Documentado em
> `GUARDRAILS.md`. Este arquivo existe para que isso não se repita.

---

## Bloco para colar no Antigravity (início de toda sessão)

```
Antes de qualquer edição, leia nesta ordem:
- ./AGENTS.md          (constituição: stack, regras invioláveis, fluxo obrigatório)
- ./GUARDRAILS.md       (padrões de falha já observados — inclui o incidente de sobrescrita)
- ./ROADMAP.md          (onde estamos, o que falta, prioridade)
- ./implementation_plan.md e ./task.md (se existirem, são o plano em andamento)

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

---

## Nota sobre este arquivo

O Antigravity não lê automaticamente arquivos de regra deste repositório (verificado: só existe
`.antigravityignore`, que é só padrão de exclusão, não instrução). **Este bloco precisa ser
colado manualmente no início de cada sessão** até/a menos que o Antigravity passe a suportar
um arquivo de regras nativo — se isso mudar, mover o conteúdo do bloco acima para o formato
nativo correspondente.
