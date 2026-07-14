# GUARDRAILS.md â€” PadrÃµes de falha jÃ¡ observados

Adicione aqui toda vez que um agente errar de forma que nÃ£o deve se repetir.
O agente lÃª este arquivo antes de qualquer tarefa.

## Regras de negÃ³cio
- NÃ£o crie um segundo lugar que calcule margem. A fonte Ãºnica Ã© packages/core/pricing.
- NÃ£o use `float` para dinheiro. Centavos em bigint, percentuais em basis points.
- NÃ£o hardcode taxa de marketplace. Ela vive em `canal_tarifa`, versionada por vigÃªncia.
- Se faltar uma taxa real, PARE e pergunte. NÃ£o invente comissÃ£o.

## CÃ³digo
- NÃ£o use `useEffect` para buscar dado do servidor. Use TanStack Query ou Server Component.
- NÃ£o crie componente novo se jÃ¡ existe equivalente em packages/ui. Estenda o existente.
- NÃ£o coloque lÃ³gica de negÃ³cio dentro de componente React.
- NÃ£o use `any`. Prefira `unknown` + Zod parse na fronteira.

## Banco de dados
- NÃ£o gere migration destrutiva sem aprovaÃ§Ã£o explÃ­cita.
- NÃ£o faÃ§a query sem filtro de `cliente_id` em tabela de negÃ³cio.
- NÃ£o faÃ§a UPDATE ou DELETE em `audit_log`. Ã‰ append-only por design.

## SeguranÃ§a
- NÃ£o logue token, senha, credencial ou qualquer campo com PII.
- NÃ£o chame API real de marketplace com credencial de produÃ§Ã£o durante desenvolvimento.

## Fluxo de trabalho / integridade do codigo
- **Antes de gerar/sobrescrever qualquer arquivo, confira o git diff primeiro**: se o arquivo ja
  existe e ja tem uma versao que compila, sua nova versao precisa ser um superset compativel,
  nao uma reescrita isolada. Um agente ja sobrescreveu packages/ui e apps/web/lib/ com uma
  versao mais antiga/pobre enquanto as telas que os consomem ja esperavam a versao nova - 30+
  erros de tsc, `any` reintroduzido, e o alias @/lib/utils quebrando o bundle da Vercel de novo.
- Depois de qualquer mudanca em packages/ui/src/components/, apps/web/lib/types.ts ou
  apps/web/lib/data/, rode `pnpm typecheck` e `pnpm lint` ANTES de considerar a tarefa concluida.
  Se algo quebrar, corrija - nao deixe o typecheck vermelho para a proxima sessao resolver.
- Em packages/ui, componentes importam `cn` de `../lib/utils` (relativo), NUNCA de
  `@/lib/utils`. Esse alias resolve contra o tsconfig do apps/web, nao do pacote - quebra o
  bundle mesmo quando o `tsc --noEmit` isolado passa.
- Ao mexer no packages/ui/src/index.ts, so ADICIONE exports. Remover um export usado por
  apps/web quebra o build sem aparecer no tsc do proprio pacote UI (so aparece no do web).
- Nunca use `any` como solucao para "nao sei o tipo ainda" (regra 1 do AGENTS.md). Se o tipo real
  ainda nao existe, defina-o em apps/web/lib/types.ts - nao deixe `Promise<any>` como atalho.
