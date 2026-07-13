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
